import { NotificationVariant, VariantContext } from "../../models/notification-variant";
import {
    Habit,
    HabitData, HabitEntryStatus,
    HabitId,
    NotificationSchedulerType,
    NotificationTemplateData,
    NotificationVariantType,
    UserId
} from "@timothyw/pat-common";
import { NotificationContent, NotificationData } from "../../models/notification-scheduler";
import { DayTimeScheduler } from "../schedulers/day-time-scheduler";
import NotificationManager from "../../controllers/notification-manager";
import NotificationTemplateManager from "../../controllers/notification-template-manager";
import HabitManager from "../../controllers/habit-manager";
import UserManager from "../../controllers/user-manager";
import DateUtils from "../../utils/date-utils";
import HabitEntryManager from "../../controllers/habit-entry-manager";

export interface HabitTimedReminderContext extends VariantContext {
    lastSent?: Date;
}

export class HabitTimedReminder extends NotificationVariant<HabitData, HabitTimedReminderContext> {
    schedulerType = NotificationSchedulerType.DAY_TIME as const;
    variantType = NotificationVariantType.HABIT_TIMED_REMINDER as const;

    async getContent(data: NotificationData): Promise<NotificationContent | null> {
        const template = await NotificationTemplateManager.getTemplateById(data.templateId);
        if (!template || !template.active || template.schedulerData.type != this.schedulerType || template.variantData.type !== this.variantType) {
            console.error('Template not found or inactive:', data.templateId);
            return null;
        }

        const habitId = data.entityId as HabitId;
        const habit = await HabitManager.getInstance().getById(habitId);
        if (!habit) {
            console.error('Habit not found for template:', data.templateId);
            return null;
        }

        const timezone = await UserManager.getInstance().getTimezone(data.userId);
        const todayDateOnlyString = DateUtils.toLocalDateOnlyString(new Date(), timezone);
        const status = await HabitEntryManager.getInstance().getStatusByDate(habitId, todayDateOnlyString);
        if (status === HabitEntryStatus.COMPLETED) {
            console.log(`Habit ${habitId} already completed for today.`);
            return null;
        }

        return {
            title: `Habit Reminder: ${habit.name}`,
            body: `Don't forget to complete your habit!`,
        };
    }

    async attemptSchedule(userId: UserId, template: NotificationTemplateData, entity: HabitData, context: HabitTimedReminderContext) {
        // const template = await NotificationTemplateManager.getTemplateById(context.templateId);
        if (!template || !template.active || template.schedulerData.type != this.schedulerType || template.variantData.type !== this.variantType) return;

        // const habitId = template.targetId as HabitId;
        // const habit = await HabitManager.getInstance().getById(habitId);
        const habit = entity;
        if (!habit) {
            console.error('Habit not found for template:', template._id);
            return;
        }

        const scheduler = NotificationManager.getScheduler(template.schedulerData.type) as DayTimeScheduler;
        const scheduledTime = await scheduler.getScheduleTime(userId, {
            templateId: template._id,
            days: template.schedulerData.days,
            time: template.schedulerData.time
        });

        if (!scheduledTime) return;

        await NotificationManager.scheduleNotification(template.variantData.type, {
            templateId: template._id,
            userId,
            entityId: habit._id,
            scheduledTime: scheduledTime.getTime().toString(),
        });
    }

    async onPostSend(data: NotificationData): Promise<void> {
        const template = await NotificationTemplateManager.getTemplateById(data.templateId);
        if (!template || !template.active || template.schedulerData.type != this.schedulerType || template.variantData.type !== this.variantType) return;

        const entityData = await NotificationTemplateManager.getEntityData(template.userId, template.targetEntityType, data.entityId);

        await this.attemptSchedule(data.userId, template, entityData, {
            lastSent: new Date(Number(data.scheduledTime))
        });
    }
}