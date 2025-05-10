import ConfigManager from "./config-manager";
import { Expo } from 'expo-server-sdk';
import { randomBytes } from 'crypto';
import RedisManager from "./redis-manager";
import {
    NotificationHandler,
    NotificationData,
    NotificationType,
} from "../models/notification-handler";
import {
    ItemDeadlineNotificationHandler,
} from "../notifications/item-deadline-notification";
import {
    ClearInboxNotificationHandler,
} from "../notifications/clear-inbox-notification";
import NotificationRunner from "./notification-runner";
import NotificationSender from "./notification-sender";

export type NotificationId = string & { readonly __brand: "NotificationId" };

export type QueuedNotification = {
    id: NotificationId;
    data: NotificationData
}

type NotificationHandlerMap = {
    [NotificationType.ITEM_DEADLINE]: ItemDeadlineNotificationHandler;
    [NotificationType.CLEAR_INBOX]: ClearInboxNotificationHandler;
    // [NotificationType.TODAY_TODO]: TodayTodoNotificationHandler;
};

export default class NotificationManager {
    private static instance: NotificationManager;
    static handlers = new Map<NotificationType, NotificationHandler>();

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
        for (let handler of NotificationManager.handlers.values()) await handler.onApiStart();
    }

    registerHandlers() {
        this.registerHandler(new ItemDeadlineNotificationHandler());
        this.registerHandler(new ClearInboxNotificationHandler());
    }

    registerHandler<T extends NotificationType>(handler: NotificationHandlerMap[T]) {
        NotificationManager.handlers.set(handler.type, handler);
    }

    static getHandler<T extends NotificationType>(type: T): NotificationHandlerMap[T] {
        const handler = NotificationManager.handlers.get(type) as NotificationHandlerMap[T];
        if (!handler) {
            throw new Error(`notification handler for type ${type} not found`);
        }
        return handler;
    }

    async scheduleNotification(data: NotificationData): Promise<void> {
        const notificationID = randomBytes(16).toString('base64url');
        const client = RedisManager.getInstance().getClient();

        await client.hset(`notification:${notificationID}`, { ...data });
        await client.zadd(`user:${data.userId}:notifications`, data.scheduledTime, notificationID);
        await client.zadd('global:notifications', data.scheduledTime, notificationID);
    }

    // TODO: implement later when notifications become configurable
    // async fetchUserNotifications(userId: UserId): Promise<QueuedNotification[]> {
    //     const client = RedisManager.getInstance().getClient();
    //
    //     const result = await client.zrange(`user:${userId}:notifications`, 0, -1, 'WITHSCORES');
    //
    //     const userNotifications = [];
    //     for (let i = 0; i < result.length; i += 2) {
    //         userNotifications.push({
    //             value: result[i],
    //             score: parseInt(result[i + 1])
    //         });
    //     }
    //
    //     console.log(`found ${userNotifications.length} notifications for user ${userId}`);
    //
    //     if (userNotifications.length === 0) return [];
    //
    //     const notifications = await Promise.all(
    //         userNotifications.map(async ({ value: idString }) => {
    //             const id = idString as NotificationId;
    //             const data = await client.hgetall(`notification:${id}`) as unknown as NotificationData;
    //
    //             if (Object.keys(data).length === 0) {
    //                 console.log(`notification ${id} not found in hash store`);
    //                 return null;
    //             }
    //
    //             return {
    //                 id,
    //                 data
    //             };
    //         })
    //     );
    //
    //     return notifications
    //         .filter(isNotNull)
    //         .sort((a, b) => a.data.scheduledTime - b.data.scheduledTime);
    // }

    static getInstance(): NotificationManager {
        if (!NotificationManager.instance) throw new Error('NotificationManager not initialized.');
        return NotificationManager.instance;
    }
}