import ConfigManager from "./config-manager";
import { Expo } from 'expo-server-sdk';
import { randomBytes } from 'crypto';
import RedisManager from "./redis-manager";
import {
    NotificationScheduler,
    NotificationData,
} from "../models/notification-scheduler";
import {
    TimeBasedScheduler,
} from "../notifications/schedulers/time-based-scheduler";
import NotificationRunner from "./notification-runner";
import NotificationSender from "./notification-sender";
import { NotificationTemplateModel } from "../models/mongo/notification-template-data";
import { NotificationTemplateData, NotificationTriggerType } from "@timothyw/pat-common";
import NotificationTemplateManager from "./notification-template-manager";

export type NotificationId = string & { readonly __brand: "NotificationId" };

export type QueuedNotification = {
    id: NotificationId;
    handler: NotificationScheduler<any, any>;
    data: NotificationData;
}

type NotificationHandlerMap = {
    // [NotificationType.ITEM_DEADLINE]: ItemDeadlineNotificationHandler;
    // [NotificationType.CLEAR_INBOX]: ClearInboxNotificationHandler;
    [NotificationTriggerType.TIME_BASED]: TimeBasedScheduler;
    // [NotificationType.TODAY_TODO]: TodayTodoNotificationHandler;
};

export default class NotificationManager {
    private static instance: NotificationManager;
    static handlers = new Map<NotificationTriggerType, NotificationScheduler>();

    private readonly _expoToken: string;
    private readonly expo: Expo;

    public readonly runner: NotificationRunner;
    public readonly sender: NotificationSender;

    private constructor() {
        this._expoToken = ConfigManager.getConfig().expo.token;
        this.expo = new Expo();

        this.registerHandlers();

        this.runner = new NotificationRunner(this);
        this.sender = new NotificationSender(this.expo);
    }

    static async init(): Promise<void> {
        if (NotificationManager.instance) throw new Error("NotificationManager is already initialized");
        NotificationManager.instance = new NotificationManager();

        const templateDocs = await NotificationTemplateModel.find({ active: true });
        const templates: NotificationTemplateData[] = templateDocs.map(doc => doc.toObject());

        console.log(`📋 Found ${templates.length} active notification templates`);
        await Promise.all(
            templates.map(template => NotificationTemplateManager.onNewTemplate(template))
        );
    }

    registerHandlers() {
        // this.registerHandler(new ItemDeadlineNotificationHandler());
        // this.registerHandler(new ClearInboxNotificationHandler());
        this.registerHandler(new TimeBasedScheduler());
    }

    registerHandler(handler: NotificationScheduler) {
        NotificationManager.handlers.set(handler.type, handler);
    }

    static getHandler(type: NotificationTriggerType): NotificationScheduler {
        const handler = NotificationManager.handlers.get(type);
        if (!handler) {
            throw new Error(`notification handler for type ${type} not found`);
        }
        return handler;
    }

    async scheduleNotification(data: NotificationData): Promise<void> {
        const notificationID = data.type.toString() + '_' + randomBytes(16).toString('base64url');
        const client = RedisManager.getInstance().getClient();

        await client.hset(`notification:${notificationID}`, { ...data });
        await client.zadd(`user:${data.userId}:notifications`, data.scheduledTime, notificationID);
        await client.zadd('global:notifications', data.scheduledTime, notificationID);
    }

    async removeNotification(id: NotificationId): Promise<void> {
        const client = RedisManager.getInstance().getClient();
        const data = await client.hgetall(`notification:${id}`) as unknown as NotificationData;

        if (!data) {
            console.log(`notification ${id} not found`);
            return;
        }

        await client.del(`notification:${id}`);
        await client.zrem(`user:${data.userId}:notifications`, id);
        await client.zrem('global:notifications', id);
    }

    static getInstance(): NotificationManager {
        if (!NotificationManager.instance) throw new Error('NotificationManager not initialized.');
        return NotificationManager.instance;
    }
}