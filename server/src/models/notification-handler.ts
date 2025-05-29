import NotificationManager from "../controllers/notification-manager";
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
    abstract getContent(userId: UserId, data: U): Promise<NotificationContent | null>;

    async onApiStart(): Promise<void> {}
    async onPostSend(userId: UserId): Promise<void> {}

    async schedule(userId: UserId, context: T) {
        const notificationManager = NotificationManager.getInstance();
        const schedules = await this.getScheduleData(userId, context);
        if (!schedules) return;
        await Promise.all(schedules.map(data => notificationManager.scheduleNotification({
            type: this.type,
            ...data
        })));
    }

    async unscheduleAllForUser(userId: UserId) {
        const client = RedisManager.getInstance().getClient();
        const keys = await client.keys(`user:${userId}:notifications`);
        await Promise.all(keys.map(key => client.del(key)));
        await client.zrem(`global:notifications`, keys);
    }
}