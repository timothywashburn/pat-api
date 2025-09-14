import { NotificationVariant, VariantContext } from "../../models/notification-variant";
import {
    DateOnlyString,
    HabitData, HabitEntryStatus,
    HabitId,
    ItemId,
    NotificationSchedulerType, NotificationTemplateData,
    NotificationVariantType,
    UserId
} from "@timothyw/pat-common";
import { NotificationContent, NotificationData } from "../../models/notification-scheduler";
import { RelativeDateScheduler } from "../schedulers/relative-date-scheduler";
import NotificationManager from "../../controllers/notification-manager";
import NotificationTemplateManager from "../../controllers/notification-template-manager";
import HabitManager from "../../controllers/habit-manager";
import HabitEntryManager from "../../controllers/habit-entry-manager";
import DateUtils from "../../utils/date-utils";
import UserManager from "../../controllers/user-manager";

export interface HabitIncompleteContext extends VariantContext {
    lastRollover?: Date;
}

export class HabitDue extends NotificationVariant<HabitData, HabitIncompleteContext> {
    schedulerType = NotificationSchedulerType.RELATIVE_DATE as const;
    variantType = NotificationVariantType.HABIT_DUE as const;

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

        const currentActiveDate = await HabitManager.getInstance().getCurrentActiveDate(habit, timezone);
        if (!currentActiveDate) {
            console.log(`No active habit period for habit ${habitId} at current time.`);
            return null;
        }

        const status = await HabitEntryManager.getInstance().getStatusByDate(habitId, currentActiveDate);
        if (status === HabitEntryStatus.COMPLETED) {
            console.log(`Habit ${habitId} already completed for today.`);
            return null;
        }

        return {
            title: `Habit Incomplete: ${habit.name}`,
            body: `Your habit is due soon!`,
        };
    }

    async attemptSchedule(userId: UserId, template: NotificationTemplateData, entity: HabitData, context: HabitIncompleteContext) {
        // const template = await NotificationTemplateManager.getTemplateById(context.templateId);
        if (!template || !template.active || template.schedulerData.type != this.schedulerType || template.variantData.type !== this.variantType) return;

        // const habitId = template.targetId as HabitId;
        // const habit = await HabitManager.getInstance().getById(habitId);
        // console.log(habitId);
        const habit = entity;
        if (!habit) {
            console.error('Habit not found for template:', template._id);
            return;
        }

        const timezone = await UserManager.getInstance().getTimezone(userId);

        const scheduler = NotificationManager.getScheduler(template.schedulerData.type) as RelativeDateScheduler;
        const scheduledTime = await scheduler.getScheduleTime(userId, {
            templateId: template._id,
            date: HabitManager.getInstance().getNextHabitEndTime(habit, context.lastRollover),
            offsetMinutes: template.schedulerData.offsetMinutes
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

        const habitId = template.targetId as HabitId;
        const habit = await HabitManager.getInstance().getById(habitId);
        if (!habit) {
            console.error('Habit not found for template:', template._id);
            return;
        }

        const timezone = await UserManager.getInstance().getTimezone(data.userId);

        const entityData = await NotificationTemplateManager.getEntityData(template.userId, template.targetEntityType, data.entityId);

        await this.attemptSchedule(data.userId, template, entityData, {
            lastRollover: new Date(HabitManager.getInstance().getNextHabitEndTime(habit).getTime() + 1),
        });
    }
}