import ConfigManager from "./config-manager";
import UserManager from "./user-manager";
import { ItemId, UserId } from "@timothyw/pat-common";
import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';
import { randomBytes } from 'crypto';
import ItemManager from "./item-manager";
import RedisManager from "./redis-manager";
import { Notification, NotificationData } from "../models/notification-handler";

// TODO: move this to utils
const isNotNull = <T>(value: T | null): value is T => value != null;

export type NotificationId = string & { readonly __brand: "NotificationId" };

export default class NotificationManager {
    private static instance: NotificationManager;
    private _expoToken: string;
    private expo: Expo;

    private constructor() {
        this._expoToken = ConfigManager.getConfig().expo.token;
        this.expo = new Expo();

        this.processNotifications().then();
        setInterval(() => this.processNotifications(), 10_000);
    }

    async processNotifications() {
        const notifications: Notification[] = await this.fetchDueNotifications(60 * 60 * 1000);
        const client = RedisManager.getInstance().getClient();

        for (const notification of notifications) {
            await this.sendToUser(
                notification.data.userId,
                notification.data.devName,
                "This thing is due soon!"
            );
            // TODO: move this to a separate function
            await client.del(`notification:${notification.id}`);
            await client.zRem(`user:${notification.data.userId}:notifications`, notification.id);
            await client.zRem('global:notifications', notification.id);
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
                const id = ref as NotificationId;
                const data = await client.hGetAll(`notification:${id}`) as unknown as NotificationData;

                if (Object.keys(data).length === 0) {
                    console.log(`notification ${id} not found in hash store`);
                    return null;
                }

                return {
                    id,
                    data
                };
            })
        );

        return notifications.filter(isNotNull);
    }

    // TODO: implement later when notifications become configurable
    async fetchUserNotifications(userId: UserId): Promise<Notification[]> {
        const client = RedisManager.getInstance().getClient();

        const userNotifications = await client.zRangeWithScores(`user:${userId}:notifications`, 0, -1);

        console.log(`found ${userNotifications.length} notifications for user ${userId}`);

        if (userNotifications.length === 0) return [];

        const notifications = await Promise.all(
            userNotifications.map(async ({ value: idString }) => {
                const id = idString as NotificationId;
                const data = await client.hGetAll(`notification:${id}`) as unknown as NotificationData;

                if (Object.keys(data).length === 0) {
                    console.log(`notification ${id} not found in hash store`);
                    return null;
                }

                return {
                    id,
                    data
                };
            })
        );

        return notifications
            .filter(isNotNull)
            .sort((a, b) => a.data.scheduledTime - b.data.scheduledTime);
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

    static async init(): Promise<void> {
        if (NotificationManager.instance) throw new Error("NotificationManager is already initialized");
        NotificationManager.instance = new NotificationManager();
    }

    static getInstance(): NotificationManager {
        if (!NotificationManager.instance) throw new Error('NotificationManager not initialized.');
        return NotificationManager.instance;
    }
}