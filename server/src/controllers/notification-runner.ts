import NotificationManager, { NotificationId, QueuedNotification } from "./notification-manager";
import RedisManager from "./redis-manager";
import { NotificationData } from "../models/notification-handler";
import { isNotNull } from "../utils/misc";

export default class NotificationRunner {
    private notificationManager: NotificationManager;
    private queue: QueuedNotification[] = [];

    constructor(notificationManager: NotificationManager) {
        this.notificationManager = notificationManager;

        this.enqueueNotifications().then();
        setInterval(() => this.enqueueNotifications(), 10 * 60 * 1000);
        // setInterval(() => this.enqueueNotifications(), 5 * 1000);

        this.sendNotifications().then();
        setInterval(() => this.sendNotifications(), 1000);
    }

    async enqueueNotifications() {
        const notifications: QueuedNotification[] = await this.fetchDueNotifications(15 * 60 * 1000);
        for (const notification of notifications) this.insertSorted(notification);
        console.log(`${notifications.length} notification${notifications.length == 1 ? "" : "s"} queued`);
    }

    async sendNotifications() {
        const now = Date.now();

        const dueNotifications: QueuedNotification[] = [];
        while (this.queue.length > 0) {
            const nextNotification = this.queue[0];

            if (nextNotification.data.scheduledTime > now) {
                // console.log(`next notification not due yet. scheduled for ${nextNotification.data.scheduledTime}, current time ${now}`);
                break;
            }

            dueNotifications.push(this.queue.shift()!);
        }

        if (dueNotifications.length === 0) return;

        const toSend = [];
        for (let notification of dueNotifications) {
            const content = await notification.handler.getContent(notification.data.userId, notification.data);
            if (!content) {
                console.log(`notification ${notification.id} cancelled`);
                continue;
            }

            toSend.push({ notification, content });
        }
        await this.notificationManager.sender.send(toSend);

        await Promise.all(dueNotifications.map(notification => this.notificationManager.removeNotification(notification.id)));
        for (let notification of dueNotifications) await notification.handler.onPostSend(notification.data.userId);

        console.log(`finished sending ${dueNotifications.length} notification${dueNotifications.length == 1 ? "" : "s"}`);
    }

    async fetchDueNotifications(timeAhead: number): Promise<QueuedNotification[]> {
        const client = RedisManager.getInstance().getClient();

        const now = Date.now();
        const futureTime = now + timeAhead;

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

                const handler = NotificationManager.getHandler(data.type);

                return {
                    id,
                    handler,
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
}