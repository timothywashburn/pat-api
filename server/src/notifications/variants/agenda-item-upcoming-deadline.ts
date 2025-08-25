import {
    NotificationVariant,
    VariantContext,
} from "../../models/notification-variant";
import {
    ItemId,
    NotificationSchedulerType,
    NotificationVariantType,
    UserId
} from "@timothyw/pat-common";
import ItemManager from "../../controllers/item-manager";
import { NotificationContent, NotificationData } from "../../models/notification-scheduler";
import { RelativeDateScheduler } from "../schedulers/relative-date-scheduler";
import NotificationManager from "../../controllers/notification-manager";
import NotificationTemplateManager from "../../controllers/notification-template-manager";

export interface AgendaItemUpcomingDeadlineContext extends VariantContext {
    lastSent?: Date;
}

// export interface AgendaItemUpcomingDeadlineData extends VariantData {
//     test: string;
// }

export class AgendaItemUpcomingDeadline extends NotificationVariant<AgendaItemUpcomingDeadlineContext> {
    schedulerType = NotificationSchedulerType.RELATIVE_DATE;
    variantType = NotificationVariantType.AGENDA_ITEM_UPCOMING_DEADLINE;

    async getContent(data: NotificationData): Promise<NotificationContent | null> {
        const template = await NotificationTemplateManager.getTemplateById(data.templateId);
        if (!template || !template.active || template.variantData.type !== this.variantType) {
            console.error('Template not found or inactive:', data.templateId);
            return null;
        }

        const itemId = template.targetId as ItemId;
        const item = await ItemManager.getInstance().getById(itemId);
        if (!item) {
            console.error('Item not found for template:', data.templateId);
            return null;
        } else if (item.completed) {
            console.log(`Item ${itemId} is completed, cancelling notification.`);
            return null;
        }

        return {
            title: `Upcoming Deadline: ${item.name}`,
            body: `hi`,
        };
    }

    async attemptSchedule(userId: UserId, context: AgendaItemUpcomingDeadlineContext) {
        const template = await NotificationTemplateManager.getTemplateById(context.templateId);
        if (!template || !template.active || template.variantData.type !== this.variantType) return;

        const itemId = template.targetId as ItemId;
        const item = await ItemManager.getInstance().getById(itemId);
        if (!item || !item.dueDate) {
            console.error('Item not found or no due date:', itemId);
            return;
        } else if (item.completed) {
            console.log(`Item ${itemId} is completed, not scheduling notification.`);
            return;
        }

        console.log(`\nScheduling notification for item ${itemId} with context:`, context);

        let scheduledTime;
        if (context.lastSent) {
            scheduledTime = new Date(new Date().getTime() + 15 * 1000);
            // scheduledTime = new Date(context.lastSent.getTime() + 20 * 60 * 1000);
        } else {
            const scheduler = NotificationManager.getScheduler(template.schedulerData.type) as RelativeDateScheduler;
            scheduledTime = await scheduler.getScheduleTime(userId, {
                templateId: template._id,
                date: item.dueDate,
                offsetMinutes: -60
            });
            if (!scheduledTime) return;
        }

        await NotificationManager.scheduleNotification(template.variantData.type, {
            templateId: template._id,
            userId,
            scheduledTime: scheduledTime.getTime().toString(),
        });
    }

    async onPostSend(data: NotificationData): Promise<void> {
        const template = await NotificationTemplateManager.getTemplateById(data.templateId);
        if (!template || !template.active || template.variantData.type !== this.variantType) return;

        await this.attemptSchedule(data.userId, {
            templateId: template._id,
            lastSent: new Date(Number(data.scheduledTime))
        });
    }
}