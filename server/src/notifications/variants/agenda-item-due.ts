import {
    NotificationVariant,
    VariantContext,
} from "../../models/notification-variant";
import {
    AgendaItemData,
    ItemId,
    NotificationSchedulerType, NotificationTemplateData,
    NotificationVariantType,
    UserId
} from "@timothyw/pat-common";
import ItemManager from "../../controllers/item-manager";
import { NotificationContent, NotificationData } from "../../models/notification-scheduler";
import { RelativeDateScheduler } from "../schedulers/relative-date-scheduler";
import NotificationManager from "../../controllers/notification-manager";
import NotificationTemplateManager from "../../controllers/notification-template-manager";
import Logger, { LogType } from "../../utils/logger";

export interface AgendaItemUpcomingDeadlineContext extends VariantContext {
    lastSent?: Date;
}

export class AgendaItemDue extends NotificationVariant<AgendaItemData, AgendaItemUpcomingDeadlineContext> {
    schedulerType = NotificationSchedulerType.RELATIVE_DATE as const;
    variantType = NotificationVariantType.AGENDA_ITEM_DUE as const;

    async getContent(data: NotificationData): Promise<NotificationContent | null> {
        const template = await NotificationTemplateManager.getTemplateById(data.templateId);
        if (!template || !template.active || template.schedulerData.type != this.schedulerType || template.variantData.type !== this.variantType) {
            Logger.logUser(data.userId, LogType.UNCLASSIFIED, 'template not found or inactive:', data.templateId);
            return null;
        }

        const itemId = data.entityId as ItemId;
        const item = await ItemManager.getInstance().getById(itemId);
        if (!item) {
            Logger.logUser(data.userId, LogType.UNCLASSIFIED, 'Item not found for template:', data.templateId);
            return null;
        } else if (item.completed) {
            Logger.logUser(data.userId, LogType.UNCLASSIFIED, `Item ${itemId} is completed, cancelling notification.`);
            return null;
        }

        return {
            title: `Upcoming Deadline: ${item.name}`,
            body: `hi`,
        };
    }

    async attemptSchedule(userId: UserId, template: NotificationTemplateData, entity: AgendaItemData, context: AgendaItemUpcomingDeadlineContext) {
        // const template = await NotificationTemplateManager.getTemplateById(context.templateId);
        if (!template || !template.active || template.schedulerData.type != this.schedulerType || template.variantData.type !== this.variantType) return;

        // const itemId = template.targetId as ItemId;
        // const item = await ItemManager.getInstance().getById(itemId);
        const item = entity;
        if (!item || !item.dueDate) {
            Logger.logUser(userId, LogType.UNCLASSIFIED, 'item not found or no due date:', item._id);
            return;
        } else if (item.completed) {
            Logger.logUser(userId, LogType.UNCLASSIFIED, `item ${item._id} is completed, not scheduling notification.`);
            return;
        }

        let scheduledTime;
        if (context.lastSent) {
            scheduledTime = new Date(new Date().getTime() + 15 * 1000);
            // scheduledTime = new Date(context.lastSent.getTime() + 20 * 60 * 1000);
        } else {
            const scheduler = NotificationManager.getScheduler(template.schedulerData.type) as RelativeDateScheduler;
            scheduledTime = await scheduler.getScheduleTime(userId, {
                templateId: template._id,
                date: item.dueDate,
                offsetMinutes: template.schedulerData.offsetMinutes
            });
            if (!scheduledTime) return;
        }

        await NotificationManager.scheduleNotification(template.variantData.type, {
            templateId: template._id,
            userId,
            entityId: item._id,
            scheduledTime: scheduledTime.getTime().toString(),
        });
    }

    async onPostSend(data: NotificationData): Promise<void> {
        const template = await NotificationTemplateManager.getTemplateById(data.templateId);
        if (!template || !template.active || template.schedulerData.type != this.schedulerType || template.variantData.type !== this.variantType) return;

        const entityData = await NotificationTemplateManager.getEntityData(template.userId, template.targetEntityType, data.entityId);

        // proof of concept for multiple notifications
        // await this.attemptSchedule(data.userId, template, entityData, {
        //     lastSent: new Date(Number(data.scheduledTime))
        // });
    }
}