import ConfigManager from "./config-manager";
import { Expo } from 'expo-server-sdk';
import { randomBytes } from 'crypto';
import RedisManager from "./redis-manager";
import {
    NotificationScheduler,
    NotificationData,
} from "../models/notification-scheduler";
import {
    RelativeDateScheduler,
} from "../notifications/schedulers/relative-date-scheduler";
import {
    DayTimeScheduler,
} from "../notifications/schedulers/day-time-scheduler";
import { NotificationTemplateModel } from "../models/mongo/notification-template-data";
import {
    NotificationTemplateData,
    NotificationSchedulerType,
    NotificationVariantType,
    NotificationTemplateId
} from "@timothyw/pat-common";
import NotificationTemplateManager from "./notification-template-manager";
import { NotificationVariant, VariantContext, VariantData } from "../models/notification-variant";
import { AgendaItemDue } from "../notifications/variants/agenda-item-due";
import NotificationSender from "./notification-sender";
import { HabitDue } from "../notifications/variants/habit-due";
import { HabitTimedReminder } from "../notifications/variants/habit-timed-reminder";

export type NotificationId = string & { readonly __brand: "NotificationId" };

export type QueuedNotification = {
    id: NotificationId;
    scheduler: NotificationScheduler;
    variant: NotificationVariant;
    data: NotificationData;
}

// type NotificationHandlerMap = {
//     // [NotificationType.ITEM_DEADLINE]: ItemDeadlineNotificationHandler;
//     // [NotificationType.CLEAR_INBOX]: ClearInboxNotificationHandler;
//     [NotificationTriggerType.TIME_BASED]: TimeBasedScheduler;
//     // [NotificationType.TODAY_TODO]: TodayTodoNotificationHandler;
// };

type NoOverlap<A, B> = Extract<keyof A, keyof B> extends never ? A : never;

export default class NotificationManager {
    static schedulers = new Map<NotificationSchedulerType, NotificationScheduler>();
    static variants = new Map<NotificationVariantType, NotificationVariant>();

    private static _expoToken: string;
    static expo: Expo;

    public static runner: NotificationSender;

    static async init(): Promise<void> {
        this._expoToken = ConfigManager.getConfig().expo.token;
        this.expo = new Expo();

        this.registerSchedulers();
        this.registerVariants();

        this.runner = new NotificationSender();

        const templateDocs = await NotificationTemplateModel.find({ active: true });
        const templates: NotificationTemplateData[] = templateDocs.map(doc => doc.toObject());

        console.log(`📋 Found ${templates.length} active notification templates`);
        // await Promise.all(
        //     templates.map(template => NotificationTemplateManager.onNewTemplate(template))
        // );
        // easier to debug
        for (let template of templates) await NotificationTemplateManager.onNewTemplate(template);
    }

    static registerSchedulers() {
        // this.registerHandler(new ItemDeadlineNotificationHandler());
        // this.registerHandler(new ClearInboxNotificationHandler());
        this.registerScheduler(new RelativeDateScheduler());
        this.registerScheduler(new DayTimeScheduler());
    }

    static registerScheduler(scheduler: NotificationScheduler) {
        NotificationManager.schedulers.set(scheduler.type, scheduler);
    }

    static registerVariants() {
        this.registerVariant(new AgendaItemDue());
        this.registerVariant(new HabitDue());
        this.registerVariant(new HabitTimedReminder());
    }

    static registerVariant(variant: NotificationVariant) {
        NotificationManager.variants.set(variant.variantType, variant);
    }

    static getScheduler(type: NotificationSchedulerType): NotificationScheduler {
        const scheduler = NotificationManager.schedulers.get(type);
        if (!scheduler) throw new Error(`notification scheduler for type ${type} not found`);
        return scheduler;
    }

    static getVariant(type: NotificationVariantType): NotificationVariant {
        const variant = NotificationManager.variants.get(type);
        if (!variant) throw new Error(`notification variant for type ${type} not found`);
        return variant;
    }

    static async scheduleNotification(
        variantType: NotificationVariantType,
        data: NotificationData
    ): Promise<void> {
        const notificationID = variantType.toString() + '_' + randomBytes(16).toString('base64url');
        const client = RedisManager.getInstance().getClient();

        await client.hset(`notification:${notificationID}`, { ...data });
        await client.zadd(`user:${data.userId}:notifications`, data.scheduledTime, notificationID);
        await client.zadd('global:notifications', data.scheduledTime, notificationID);

        const date = new Date(parseInt(data.scheduledTime));
        console.log(`Scheduled notification ${notificationID} for user ${data.userId} at ${date.toLocaleString()} (${data.scheduledTime})`);
    }

    static async removeNotification(id: NotificationId): Promise<void> {
        const client = RedisManager.getInstance().getClient();
        const data = await client.hgetall(`notification:${id}`) as unknown as NotificationData;

        if (!data || Object.keys(data).length === 0) {
            console.log(`notification ${id} not found`);
            return;
        }

        await client.del(`notification:${id}`);
        await client.zrem(`user:${data.userId}:notifications`, id);
        await client.zrem('global:notifications', id);

        this.runner.removeFromQueue(id);
    }

    static async removeNotificationsForTemplate(templateId: NotificationTemplateId) {
        const client = RedisManager.getInstance().getClient();
        const allNotifications = await client.zrange('global:notifications', 0, -1);

        for (const notificationId of allNotifications) {
            const data = await client.hgetall(`notification:${notificationId}`) as unknown as NotificationData;
            if (data.templateId === templateId.toString()) await this.removeNotification(notificationId as NotificationId);
        }

        console.log(`Removed all notifications for template ${templateId}`);
    }

    static async removeNotificationsForEntity(entityId: string) {
        const client = RedisManager.getInstance().getClient();
        const allNotifications = await client.zrange('global:notifications', 0, -1);

        for (const notificationId of allNotifications) {
            const data = await client.hgetall(`notification:${notificationId}`) as unknown as NotificationData;
            if (data.entityId === entityId) await this.removeNotification(notificationId as NotificationId);
        }

        console.log(`Removed all notifications for entity ${entityId}`);
    }
}