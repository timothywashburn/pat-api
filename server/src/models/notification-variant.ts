import {
    NotificationSchedulerType,
    NotificationTemplateId, NotificationVariantType,
    UserId
} from "@timothyw/pat-common";
import NotificationManager from "../controllers/notification-manager";
import { NotificationContent, NotificationData, NotificationScheduler } from "./notification-scheduler";

export interface VariantContext {
    templateId: NotificationTemplateId
}

export interface VariantData {
}

export abstract class NotificationVariant<T extends VariantContext = VariantContext> {
    abstract schedulerType: NotificationSchedulerType;
    abstract variantType: NotificationVariantType;

    // abstract getVariantData(userId: UserId, context: VariantContext): Promise<T | null>;
    abstract getContent(data: NotificationData): Promise<NotificationContent | null>;
    abstract attemptSchedule(userId: UserId, context: T): Promise<void>;

    async onPostSend(data: NotificationData): Promise<void> {}

    getScheduler(): NotificationScheduler {
        return NotificationManager.getScheduler(this.schedulerType);
    }
}