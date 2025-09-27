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
import { TZDate } from "@date-fns/tz";

interface DayTimeContext extends SchedulerContext {
    days: number[];
    offsetMinutes: number;
}

export class DayTimeScheduler extends NotificationScheduler<DayTimeContext> {
    type = NotificationSchedulerType.DAY_TIME;
    
    async getScheduleTime(userId: UserId, context: DayTimeContext): Promise<Date | null> {
        if (context.days.length === 0) return null;
        const timezone = await UserManager.getInstance().getTimezone(userId);

        const startOfDay = new TZDate(new Date(), timezone);
        startOfDay.setHours(0, 0, 0, 0);
        const currentDayOfWeek = startOfDay.getDay();
        
        let daysToAdd = 0;
        for (let i = 0; i <= 7; i++) {
            const dayToCheck = (currentDayOfWeek + i) % 7;
            if (context.days.includes(dayToCheck)) {
                daysToAdd = i;
                break;
            }
        }
        
        return new Date(startOfDay.getTime() + daysToAdd * 24 * 60 * 60 * 1000 + context.offsetMinutes * 60 * 1000);
    }
}