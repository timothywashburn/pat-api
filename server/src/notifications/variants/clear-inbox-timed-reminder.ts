import { NotificationVariant, VariantContext } from "../../models/notification-variant";
import {
    NotificationSchedulerType,
    NotificationTemplateData,
    NotificationVariantType,
    UserId
} from "@timothyw/pat-common";
import { NotificationContent, NotificationData } from "../../models/notification-scheduler";
import { DayTimeScheduler } from "../schedulers/day-time-scheduler";
import NotificationManager from "../../controllers/notification-manager";
import NotificationTemplateManager from "../../controllers/notification-template-manager";
import Logger, { LogType } from "../../utils/logger";

export interface ClearInboxTimedReminderContext extends VariantContext {
    lastSent?: Date;
}

export interface InboxPanelData {
    inboxCount: number;
}

export class ClearInboxTimedReminder extends NotificationVariant<InboxPanelData, ClearInboxTimedReminderContext> {
    schedulerType = NotificationSchedulerType.DAY_TIME as const;
    variantType = NotificationVariantType.CLEAR_INBOX_TIMED_REMINDER as const;

    async getContent(data: NotificationData): Promise<NotificationContent | null> {
        const template = await NotificationTemplateManager.getTemplateById(data.templateId);
        if (!template || !template.active || template.schedulerData.type != this.schedulerType || template.variantData.type !== this.variantType) {
            Logger.logUser(data.userId, LogType.UNCLASSIFIED, 'template not found or inactive:', data.templateId);
            return null;
        }

        const entityData = await NotificationTemplateManager.getEntityData(template.userId, template.targetEntityType, data.entityId) as InboxPanelData;
        if (!entityData || entityData.inboxCount === 0) {
            Logger.logUser(data.userId, LogType.UNCLASSIFIED, 'inbox is empty, no reminder needed.');
            return null;
        }

        return {
            title: `Clear Your Inbox!`,
            body: `You have ${entityData.inboxCount} item${entityData.inboxCount == 1 ? '' : 's'} to go through`,
        };
    }

    async attemptSchedule(userId: UserId, template: NotificationTemplateData, entity: InboxPanelData, context: ClearInboxTimedReminderContext) {
        if (!template || !template.active || template.schedulerData.type != this.schedulerType || template.variantData.type !== this.variantType) return;

        if (!entity || entity.inboxCount === 0) {
            Logger.logUser(userId, LogType.UNCLASSIFIED, 'inbox is empty, skipping schedule.');
            return;
        }

        const scheduler = NotificationManager.getScheduler(template.schedulerData.type) as DayTimeScheduler;
        const scheduledTime = await scheduler.getScheduleTime(userId, {
            templateId: template._id,
            days: template.schedulerData.days,
            offsetMinutes: template.schedulerData.offsetMinutes
        });

        if (!scheduledTime) return;

        await NotificationManager.scheduleNotification(template.variantData.type, {
            templateId: template._id,
            userId,
            entityId: 'inbox_panel',
            scheduledTime: scheduledTime.getTime().toString(),
        });
    }

    async onPostSend(data: NotificationData): Promise<void> {
        const template = await NotificationTemplateManager.getTemplateById(data.templateId);
        if (!template || !template.active || template.schedulerData.type != this.schedulerType || template.variantData.type !== this.variantType) return;

        const entityData = await NotificationTemplateManager.getEntityData(template.userId, template.targetEntityType, data.entityId) as InboxPanelData;

        await this.attemptSchedule(data.userId, template, entityData, {
            lastSent: new Date(Number(data.scheduledTime))
        });
    }
}