import NotificationManager from "../controllers/notification-manager";
import {
    NotificationTemplateData,
    NotificationTemplateLevel,
    NotificationTriggerType,
    UserId
} from "@timothyw/pat-common";
import RedisManager from "../controllers/redis-manager";
import { NotificationTemplateModel } from "./mongo/notification-template-data";
import NotificationTemplateManager from "../controllers/notification-template-manager";

export interface NotificationContext {
    templateId: string;
}

export interface NotificationData {
    type: NotificationTriggerType;
    userId: UserId;
    scheduledTime: string;
}

export interface NotificationContent {
    title: string;
    body: string;
}

// export enum NotificationType {
//     ITEM_DEADLINE = 'item_deadline',
//     CLEAR_INBOX = 'clear_inbox',
//     TIME_BASED = 'generic_template',
//     // TODAY_TODO = 'today_todo',
// }

export type ScheduleDataResult<U extends NotificationData> = Promise<Omit<U, 'type'>[] | undefined>;

export abstract class NotificationHandler<
    T extends NotificationContext = NotificationContext,
    U extends NotificationData = NotificationData
> {
    abstract type: NotificationTriggerType;

    // going to change context from generic T --> NotificationContext
    protected abstract getScheduleData(userId: UserId, context: NotificationContext): ScheduleDataResult<U>;
    abstract getContent(userId: UserId, data: U): Promise<NotificationContent | null>;

    // async onApiStart(): Promise<void> {}
    async onPostSend(data: U): Promise<void> {}

    // going to change context from generic T --> NotificationContext
    async schedule(userId: UserId, context: NotificationContext) {
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