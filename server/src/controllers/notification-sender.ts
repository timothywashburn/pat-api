import NotificationManager, { NotificationId, QueuedNotification } from "./notification-manager";
import RedisManager from "./redis-manager";
import { NotificationContent, NotificationData } from "../models/notification-scheduler";
import { isNotNull } from "../utils/misc";
import NotificationTemplateManager from "./notification-template-manager";
import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import UserManager from "./user-manager";

type ToSend = {
    notification: QueuedNotification;
    content: NotificationContent;
}[];

const NOTIFICATION_DRY_RUN = false;

export default class NotificationSender {
    private queue: QueuedNotification[] = [];

    constructor() {
        // setInterval(() => this.enqueueNotifications(), 10 * 60 * 1000);
        setInterval(() => this.enqueueNotifications(), 5 * 1000);

        setInterval(() => this.sendNotifications(), 1000);
    }

    async enqueueNotifications() {
        const notifications: QueuedNotification[] = await this.fetchDueNotifications(15 * 60 * 1000);
        for (const notification of notifications) this.insertSorted(notification);
        console.log(`${notifications.length} notification${notifications.length == 1 ? "" : "s"} queued`);
    }

    async sendNotifications() {
        const now = new Date();

        const dueNotifications: QueuedNotification[] = [];
        while (this.queue.length > 0) {
            const nextNotification = this.queue[0];

            if (Number(nextNotification.data.scheduledTime) > now.getTime()) {
                const date = new Date(Number(nextNotification.data.scheduledTime));
                // console.log(`next notification not due yet. scheduled for ${date.toLocaleString()}, current time ${now.toLocaleString()}`);
                break;
            }

            dueNotifications.push(this.queue.shift()!);
        }

        if (dueNotifications.length === 0) return;

        const toSend = [];
        for (let notification of dueNotifications) {
            const content = await notification.variant.getContent(notification.data);
            if (!content) {
                console.log(`notification ${notification.id} cancelled`);
                continue;
            }

            toSend.push({ notification, content });
        }
        await this.send(toSend);

        await Promise.all(dueNotifications.map(notification => NotificationManager.removeNotification(notification.id)));
        for (let notification of dueNotifications){
            await notification.scheduler.onPostSend(notification.data);
            await notification.variant.onPostSend(notification.data);
        }

        console.log(`finished sending ${dueNotifications.length} notification${dueNotifications.length == 1 ? "" : "s"}`);
    }

    async send(toSend: ToSend): Promise<void> {
        try {
            if (NOTIFICATION_DRY_RUN) {
                console.log('\n🔔 ============ TEST NOTIFICATION TRIGGERED ============');
                for (const { notification, content } of toSend) {
                    console.log(`🔔 Notification: ${JSON.stringify(notification, null, 2)}`);
                    console.log(`📄 Content: ${JSON.stringify(content, null, 2)}`);
                }
                console.log('============ END TEST NOTIFICATION ============\n');
                return;
            }

            const messages: ExpoPushMessage[] = [];

            for (const { notification, content } of toSend) {
                const userId = notification.data.userId;

                const user = await UserManager.getInstance().getById(userId);
                if (!user || !user.sandbox || !user.sandbox.devices || user.sandbox.devices.length === 0) {
                    console.log(`no devices found for user ${userId}`)
                    continue;
                }

                const pushTokens = user.sandbox.devices.map(device => device.pushToken);

                for (const pushToken of pushTokens) {
                    if (!Expo.isExpoPushToken(pushToken)) {
                        console.log(`invalid expo push token: ${pushToken}`)
                        continue;
                    }

                    messages.push({
                        to: pushToken,
                        sound: 'default',
                        title: (process.env.NODE_ENV === 'development' ? "(Dev) " : "") + content.title,
                        body: content.body,
                        // data (any = {})
                    });
                }
            }

            const chunks = NotificationManager.expo.chunkPushNotifications(messages);
            const tickets: ExpoPushTicket[] = [];

            for (const chunk of chunks) {
                try {
                    const ticketChunk = await NotificationManager.expo.sendPushNotificationsAsync(chunk);
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

    async fetchDueNotifications(timeAhead: number): Promise<QueuedNotification[]> {
        const client = RedisManager.getInstance().getClient();

        // const now = Date.now();
        // const futureTime = now + timeAhead;
        const now = 0;
        const futureTime = Date.now() + timeAhead;

        const dueNotificationRefs = await client.zrangebyscore(
            'global:notifications',
            now,
            futureTime
        );

        if (dueNotificationRefs.length === 0) return [];

        const notifications = await Promise.all(
            dueNotificationRefs.map(async (ref) => {
                const id = ref as NotificationId;
                for (let queuedNotification of this.queue) if (queuedNotification.id === id) return null;
                const data = await client.hgetall(`notification:${id}`) as unknown as NotificationData;

                if (Object.keys(data).length === 0) {
                    console.log(`notification ${id} not found in hash store`);
                    return null;
                }

                const template = await NotificationTemplateManager.getTemplateById(data.templateId);
                if (!template || !template.active) {
                    console.log(`notification template ${data.templateId} not found or inactive`);
                    return null;
                }

                const scheduler = NotificationManager.getScheduler(template.schedulerData.type);
                const variant = NotificationManager.getVariant(template.variantData.type);

                return {
                    id,
                    scheduler,
                    variant,
                    data
                };
            })
        );

        return notifications.filter(isNotNull);
    }

    private insertSorted(notification: QueuedNotification) {
        const index = this.queue.findIndex(n => n.data.scheduledTime > notification.data.scheduledTime);
        if (index === -1) {
            this.queue.push(notification);
        } else {
            this.queue.splice(index, 0, notification);
        }
    }

    public getQueue(): QueuedNotification[] {
        return this.queue;
    }

    public removeFromQueue(notificationId: NotificationId): boolean {
        const index = this.queue.findIndex(n => n.id === notificationId);
        if (index !== -1) {
            this.queue.splice(index, 1);
            return true;
        }
        return false;
    }
}