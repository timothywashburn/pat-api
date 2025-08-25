import {
    NotificationTemplateId,
    NotificationSchedulerType,
    UserId
} from "@timothyw/pat-common";

export interface SchedulerContext {
    templateId: NotificationTemplateId;
}

export interface NotificationData {
    templateId: NotificationTemplateId;
    userId: UserId;
    scheduledTime: string;
}

export interface NotificationContent {
    title: string;
    body: string;
}

export abstract class NotificationScheduler<T extends SchedulerContext = SchedulerContext, > {
    abstract type: NotificationSchedulerType;

    abstract getScheduleTime(userId: UserId, context: T): Promise<Date | null>;

    async onPostSend(data: NotificationData): Promise<void> {}

    // async unscheduleAllForUser(userId: UserId) {
    //     const client = RedisManager.getInstance().getClient();
    //     const keys = await client.keys(`user:${userId}:notifications`);
    //     await Promise.all(keys.map(key => client.del(key)));
    //     await client.zrem(`global:notifications`, keys);
    // }
}