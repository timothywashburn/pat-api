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

        const now = new Date();
        const startOfDay = new TZDate(now, timezone);
        startOfDay.setHours(0, 0, 0, 0);
        const currentDayOfWeek = startOfDay.getDay();

        const notificationTime = new Date(startOfDay.getTime() + context.offsetMinutes * 60 * 1000);
        for (let i = 0; i < 8; i++) {
            const dayToCheck = (currentDayOfWeek + i) % 7;
            if (context.days.includes(dayToCheck) && notificationTime.getTime() > now.getTime()) break;
            notificationTime.setDate(notificationTime.getDate() + 1);
        }

        return notificationTime;
    }
}