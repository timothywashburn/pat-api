import ConfigManager from "./config-manager";
import UserManager from "./user-manager";
import { ItemId, UserId } from "@timothyw/pat-common";
import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';
import { randomBytes } from 'crypto';
import ItemManager from "./item-manager";
import RedisManager from "./redis-manager";

// TODO: move this to utils
const isNotNull = <T>(value: T | null): value is T => value != null;

// TODO: move this to common lib, make it notification = notificationdata & id
export interface Notification {
    notificationId: NotificationId;
    itemId: ItemId;
    userId: UserId;
    scheduledTime: number;
    devName: string;
}
export type NotificationId = string & { readonly __brand: "NotificationId" };

export default class NotificationManager {
    private static instance: NotificationManager;
    private static _expoToken: string;
    private expo: Expo;

    private constructor() {
        this.expo = new Expo();
    }

    static async init(): Promise<void> {
        if (NotificationManager.instance) throw new Error("NotificationManager is already initialized");
        NotificationManager.instance = new NotificationManager();

        this._expoToken = ConfigManager.getConfig().expo.token;

        this.instance.processNotifications().then();
        setInterval(() => this.instance.processNotifications(), 10_000);
    }

    async processNotifications() {
        const notifications = await this.fetchDueNotifications(60 * 60 * 1000);
        const client = RedisManager.getInstance().getClient();

        for (const notification of notifications) {
            await this.sendToUser(
                notification.userId,
                notification.devName,
                "This thing is due soon!"
            );
            // TODO: move this to a separate function
            await client.del(`notification:${notification.notificationId}`);
            await client.zRem(`user:${notification.userId}:notifications`, notification.notificationId);
            await client.zRem('global:notifications', notification.notificationId);
        }
    }

    async fetchDueNotifications(timeAhead: number): Promise<Notification[]> {
        console.log(`fetching notifications due in the next ${timeAhead}ms`);
        const client = RedisManager.getInstance().getClient();

        const now = Date.now();
        const futureTime = now + timeAhead;

        const dueNotificationRefs = await client.zRangeByScore(
            'global:notifications',
            now,
            futureTime
        );

        console.log(`${dueNotificationRefs.length} notifications due`);

        if (dueNotificationRefs.length === 0) return [];

        const notifications = await Promise.all(
            dueNotificationRefs.map(async (ref) => {
                const notificationId = ref as NotificationId;
                const notificationData = await client.hGetAll(`notification:${notificationId}`) as Omit<Notification, 'notificationId'>;

                if (Object.keys(notificationData).length === 0) {
                    console.log(`notification ${notificationId} not found in hash store`);
                    return null;
                }

                return {
                    notificationId: notificationId,
                    ...notificationData
                };
            })
        );

        return notifications.filter(isNotNull);
    }

    // TODO: implement later when notifications become configurable
    async fetchUserNotifications(userId: UserId) {
        const client = RedisManager.getInstance().getClient();

        const userNotifications = await client.zRangeWithScores(`user:${userId}:notifications`, 0, -1);

        console.log(`found ${userNotifications.length} notifications for user ${userId}`);

        if (userNotifications.length === 0) return [];

        const notifications = await Promise.all(
            userNotifications.map(async ({ value: notificationId }) => {
                const notificationData = await client.hGetAll(`notification:${notificationId}`) as Omit<Notification, 'notificationId'>;

                if (Object.keys(notificationData).length === 0) {
                    console.log(`notification ${notificationId} not found in hash store`);
                    return null;
                }

                return {
                    notificationId,
                    ...notificationData
                };
            })
        );

        return notifications
            .filter(isNotNull)
            .sort((a, b) => a.scheduledTime - b.scheduledTime);
    }

    async scheduleNotificationsForItem(userId: UserId, itemId: ItemId): Promise<void> {
        console.log(`scheduling notifications for user ${userId} and item ${itemId}`);
        try {
            const user = await UserManager.getInstance().getById(userId);
            const item = await ItemManager.getInstance().getById(itemId);

            if (!user) {
                console.log(`user ${userId} not found`);
                return;
            }

            if (!item) {
                console.log(`item ${itemId} not found`);
                return;
            }

            if (!item.dueDate) {
                console.log(`item ${itemId} does not have a due date`);
                return;
            }

            const notificationID = randomBytes(16).toString('base64url');
            // const scheduledTime = item.dueDate.getTime() - 60 * 60 * 1000;
            const scheduledTime = new Date().getTime() + 10 * 60 * 1000;

            const notification: Omit<Notification, 'notificationId'> = {
                itemId,
                userId,
                scheduledTime,
                devName: item.name
            };

            const client = RedisManager.getInstance().getClient();
            await client.hSet(`notification:${notificationID}`, notification);
            await client.zAdd(`user:${userId}:notifications`, {
                value: notificationID,
                score: scheduledTime
            });
            await client.zAdd('global:notifications', {
                value: notificationID,
                score: scheduledTime
            });
        } catch (error) {
            console.log(`error scheduling notifications: ${error}`)
        }
    }

    async sendToUser(userId: UserId, title: string, body: string, data: any = {}): Promise<void> {
        try {
            const user = await UserManager.getInstance().getById(userId);
            if (!user || !user.sandbox || !user.sandbox.devices || user.sandbox.devices.length === 0) {
                console.log(`no devices found for user ${userId}`)
                return;
            }

            const pushTokens = user.sandbox.devices.map(device => device.pushToken);
            console.log(`sending notification to ${pushTokens.length} devices for user ${userId}`)

            await this.sendToDevices(pushTokens, title, body, data);
        } catch (error) {
            console.log(`error sending notifications: ${error}`)
        }
    }

    async sendToDevices(pushTokens: string[], title: string, body: string, data: any = {}): Promise<void> {
        try {
            const messages: ExpoPushMessage[] = [];

            for (const pushToken of pushTokens) {
                if (!Expo.isExpoPushToken(pushToken)) {
                    console.log(`invalid expo push token: ${pushToken}`)
                    continue;
                }

                messages.push({
                    to: pushToken,
                    sound: 'default',
                    title,
                    body,
                    data
                });
            }

            const chunks = this.expo.chunkPushNotifications(messages);
            const tickets: ExpoPushTicket[] = [];

            for (const chunk of chunks) {
                try {
                    const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
                    tickets.push(...ticketChunk);
                    console.log(`sent notifications chunk with ${chunk.length} messages`)
                } catch (error) {
                    console.log(`error sending notification chunk: ${error}`)
                }
            }

            await this.handlePushNotificationTickets(tickets);
        } catch (error) {
            console.log(`error in sendToDevices: ${error}`)
        }
    }

    private async handlePushNotificationTickets(tickets: ExpoPushTicket[]): Promise<void> {
    //     TODO: DO NOT IMPLEMENT YET
    }

    static getInstance(): NotificationManager {
        if (!NotificationManager.instance) throw new Error('NotificationManager not initialized.');
        return NotificationManager.instance;
    }
}