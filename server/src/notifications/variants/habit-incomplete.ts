import { NotificationVariant, VariantContext, VariantData } from "../../models/notification-variant";
import { HabitId, ItemId, NotificationSchedulerType, NotificationVariantType, UserId } from "@timothyw/pat-common";
import ItemManager from "../../controllers/item-manager";
import { NotificationContent, NotificationData } from "../../models/notification-scheduler";
import { RelativeDateScheduler } from "../schedulers/relative-date-scheduler";
import NotificationManager from "../../controllers/notification-manager";
import NotificationTemplateManager from "../../controllers/notification-template-manager";
import HabitManager from "../../controllers/habit-manager";
import HabitEntryManager from "../../controllers/habit-entry-manager";
import DateUtils from "../../utils/date-utils";
import { HabitEntryStatus } from "@timothyw/pat-common/dist/types/models";
import UserManager from "../../controllers/user-manager";

export interface HabitIncompleteContext extends VariantContext {
    lastRollover?: Date;
}

export class HabitIncomplete extends NotificationVariant<HabitIncompleteContext> {
    schedulerType = NotificationSchedulerType.RELATIVE_DATE;
    variantType = NotificationVariantType.HABIT_INCOMPLETE;

    async getContent(data: NotificationData): Promise<NotificationContent | null> {
        const template = await NotificationTemplateManager.getTemplateById(data.templateId);
        if (!template || !template.active || template.variantData.type !== this.variantType) {
            console.error('Template not found or inactive:', data.templateId);
            return null;
        }

        const habitId = template.targetId as HabitId;
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
            title: `Habit Incomplete: ${habit.name}`,
            body: `Don't forget to complete your habit!`,
        };
    }

    async attemptSchedule(userId: UserId, context: HabitIncompleteContext) {
        const template = await NotificationTemplateManager.getTemplateById(context.templateId);
        if (!template || !template.active || template.variantData.type !== this.variantType) return;

        const habitId = template.targetId as HabitId;
        const habit = await HabitManager.getInstance().getById(habitId);
        if (!habit) {
            console.error('Habit not found for template:', template._id);
            return;
        }

        const timezone = await UserManager.getInstance().getTimezone(userId);
        const [hours, minutes] = habit.rolloverTime.split(':').map(Number);

        const scheduler = NotificationManager.getScheduler(template.schedulerData.type) as RelativeDateScheduler;
        const scheduledTime = await scheduler.getScheduleTime(userId, {
            templateId: template._id,
            date: DateUtils.nextTimeInTimezoneAsUTC(hours, minutes, 0, timezone, context.lastRollover),
            offsetMinutes: -60
        });
        if (!scheduledTime) return;

        await NotificationManager.scheduleNotification(template.variantData.type, {
            templateId: template._id,
            userId,
            scheduledTime: scheduledTime.getTime().toString(),
        });
    }

    async onPostSend(data: NotificationData): Promise<void> {
        const template = await NotificationTemplateManager.getTemplateById(data.templateId);
        if (!template || !template.active || template.variantData.type !== this.variantType) return;

        const habitId = template.targetId as HabitId;
        const habit = await HabitManager.getInstance().getById(habitId);
        if (!habit) {
            console.error('Habit not found for template:', template._id);
            return;
        }

        const timezone = await UserManager.getInstance().getTimezone(data.userId);
        const [hours, minutes] = habit.rolloverTime.split(':').map(Number);

        await this.attemptSchedule(data.userId, {
            templateId: template._id,
            lastRollover: new Date(DateUtils.nextTimeInTimezoneAsUTC(hours, minutes, 0, timezone).getTime() + 1),
        });
    }
}