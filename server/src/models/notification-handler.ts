import { NotificationId } from "../controllers/notification-manager";
import { UserId } from "@timothyw/pat-common";

export type Notification<T extends NotificationData = NotificationData> = {
    id: NotificationId;
    data: T
}

export interface NotificationData {
    userId: UserId;
    scheduledTime: number;
    devName: string;
}

export enum NotificationType {
    ITEM_DEADLINE = 'task_deadline',
    CLEAR_INBOX = 'clear_inbox',
    TODAY_TODO = 'today_todo',
}

export interface NotificationHandler<T> {
    type: NotificationType;
    schedule: (userId: UserId, data: T) => Promise<void>;
}