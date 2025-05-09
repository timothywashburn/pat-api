import NotificationManager, { QueuedNotification } from "../controllers/notification-manager";
import { UserId } from "@timothyw/pat-common";
import RedisManager from "../controllers/redis-manager";

export interface NotificationContext {}

export interface NotificationData {
    type: NotificationType;
    userId: UserId;
    scheduledTime: number;
}

export interface NotificationContent {
    title: string;
    body: string;
}

export enum NotificationType {
    ITEM_DEADLINE = 'task_deadline',
    CLEAR_INBOX = 'clear_inbox',
    // TODAY_TODO = 'today_todo',
}

export type ScheduleDataResult<U extends NotificationData> = Promise<Omit<U, 'type'>[] | undefined>;

export abstract class NotificationHandler<
    T extends NotificationContext = NotificationContext,
    U extends NotificationData = NotificationData
> {
    abstract type: NotificationType;

    protected abstract getScheduleData(userId: UserId, context: T): ScheduleDataResult<U>;
    protected abstract getContent(userId: UserId, data: U): Promise<NotificationContent | null>;

    async onApiStart(): Promise<void> {}
    protected async onPostSend(userId: UserId): Promise<void> {}

    async schedule(userId: UserId, context: T) {
        const notificationManager = NotificationManager.getInstance();
        const schedules = await this.getScheduleData(userId, context);
        if (!schedules) return;
        await Promise.all(schedules.map(data => notificationManager.scheduleNotification({
            type: this.type,
            ...data
        })));
    }

    async sendNotification(notification: QueuedNotification) {
        console.log(`sending notification ${notification.id}`);
        const client = RedisManager.getInstance().getClient();

        const content = await this.getContent(notification.data.userId, notification.data as U);
        if (content) {
            await NotificationManager.getInstance().sendToUser(
                notification.data.userId,
                content.title,
                content.body
            );
        }

        await client.del(`notification:${notification.id}`);
        await client.zrem(`user:${notification.data.userId}:notifications`, notification.id);
        await client.zrem('global:notifications', notification.id);

        await this.onPostSend(notification.data.userId);
    }
}