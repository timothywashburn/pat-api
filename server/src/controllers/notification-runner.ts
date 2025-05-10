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
    }

    async sendNotifications() {
        const now = Date.now();

        while (this.queue.length > 0) {
            const nextNotification = this.queue[0];

            if (nextNotification.data.scheduledTime > now) {
                // console.log(`next notification not due yet. scheduled for ${nextNotification.data.scheduledTime}, current time ${now}`);
                break;
            }

            const handler = NotificationManager.getHandler(nextNotification.data.type);
            handler.sendNotification(nextNotification).then();

            this.queue.shift();
        }
    }

    async fetchDueNotifications(timeAhead: number): Promise<QueuedNotification[]> {
        // console.log(`fetching notifications due in the next ${timeAhead}ms`);
        const client = RedisManager.getInstance().getClient();

        const now = Date.now();
        const futureTime = now + timeAhead;

        const dueNotificationRefs = await client.zrangebyscore(
            'global:notifications',
            now,
            futureTime
        );

        console.log(`${dueNotificationRefs.length} notification${dueNotificationRefs.length == 1 ? "" : "s"} queued`);

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

                return {
                    id,
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
}