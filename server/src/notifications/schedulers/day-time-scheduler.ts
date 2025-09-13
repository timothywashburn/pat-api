import {
    SchedulerContext,
    NotificationData,
    NotificationScheduler,
} from "../../models/notification-scheduler";
import {
    NotificationSchedulerType,
    UserId
} from "@timothyw/pat-common";
import UserManager from "../../controllers/user-manager";
import DateUtils from "../../utils/date-utils";

interface DayTimeContext extends SchedulerContext {
    days: number[];
    time: string;
}

export class DayTimeScheduler extends NotificationScheduler<DayTimeContext> {
    type = NotificationSchedulerType.DAY_TIME;
    
    async getScheduleTime(userId: UserId, context: DayTimeContext): Promise<Date | null> {
        if (context.days.length === 0) return null;

        const timezone = await UserManager.getInstance().getTimezone(userId);
        const [hours, minutes] = context.time.split(':').map(Number);

        // Get the next occurrence of any of the specified days at the specified time
        const now = new Date();
        const currentDayOfWeek = now.getDay();
        
        // Find the next day that matches one of the specified days
        let nextDay = null;
        let daysToAdd = 0;
        
        // First check if today is one of the scheduled days and if the time hasn't passed yet
        // TODO: this code can probably be merged with the check underneath
        if (context.days.includes(currentDayOfWeek)) {
            const todayAtTime = DateUtils.nextTimeInTimezoneAsUTC(hours, minutes, 0, timezone);
            if (todayAtTime > now) return todayAtTime;
        }
        
        // Find the next scheduled day
        for (let i = 1; i <= 7; i++) {
            const dayToCheck = (currentDayOfWeek + i) % 7;
            if (context.days.includes(dayToCheck)) {
                daysToAdd = i;
                nextDay = dayToCheck;
                break;
            }
        }
        
        if (nextDay === null) return null;
        
        // Calculate the target date
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        
        return DateUtils.nextTimeInTimezoneAsUTC(hours, minutes, 0, timezone, targetDate);
    }
}