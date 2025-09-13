import { NotificationVariant, VariantContext } from "../../models/notification-variant";
import { HabitId, NotificationSchedulerType, NotificationVariantType, UserId } from "@timothyw/pat-common";
import { NotificationContent, NotificationData } from "../../models/notification-scheduler";
import { DayTimeScheduler } from "../schedulers/day-time-scheduler";
import NotificationManager from "../../controllers/notification-manager";
import NotificationTemplateManager from "../../controllers/notification-template-manager";
import HabitManager from "../../controllers/habit-manager";

export interface HabitTimedReminderContext extends VariantContext {
    lastSent?: Date;
}

export class HabitTimedReminder extends NotificationVariant<HabitTimedReminderContext> {
    schedulerType = NotificationSchedulerType.DAY_TIME as const;
    variantType = NotificationVariantType.HABIT_TIMED_REMINDER as const;

    async getContent(data: NotificationData): Promise<NotificationContent | null> {
        const template = await NotificationTemplateManager.getTemplateById(data.templateId);
        if (!template || !template.active || template.schedulerData.type != this.schedulerType || template.variantData.type !== this.variantType) {
            console.error('Template not found or inactive:', data.templateId);
            return null;
        }

        const habitId = template.targetId as HabitId;
        const habit = await HabitManager.getInstance().getById(habitId);
        if (!habit) {
            console.error('Habit not found for template:', data.templateId);
            return null;
        }

        return {
            title: `Habit Reminder: ${habit.name}`,
            body: `Time to work on your habit!`,
        };
    }

    async attemptSchedule(userId: UserId, context: HabitTimedReminderContext) {
        const template = await NotificationTemplateManager.getTemplateById(context.templateId);
        if (!template || !template.active || template.schedulerData.type != this.schedulerType || template.variantData.type !== this.variantType) return;

        const habitId = template.targetId as HabitId;
        const habit = await HabitManager.getInstance().getById(habitId);
        if (!habit) {
            console.error('Habit not found for template:', template._id);
            return;
        }

        console.log(`\nScheduling timed reminder for habit ${habitId} with context:`, context);

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
            scheduledTime: scheduledTime.getTime().toString(),
        });
    }

    async onPostSend(data: NotificationData): Promise<void> {
        const template = await NotificationTemplateManager.getTemplateById(data.templateId);
        if (!template || !template.active || template.schedulerData.type != this.schedulerType || template.variantData.type !== this.variantType) return;

        // Schedule the next occurrence of this reminder
        await this.attemptSchedule(data.userId, {
            templateId: template._id,
            lastSent: new Date(Number(data.scheduledTime))
        });
    }
}