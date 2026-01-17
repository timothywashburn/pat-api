import {
    SchedulerContext,
    NotificationScheduler,
} from "../../models/notification-scheduler";
import {
    NotificationSchedulerType,
    UserId
} from "@timothyw/pat-common";

interface RelativeDateContext extends SchedulerContext {
    date: Date;
    offsetMinutes: number;
}

export class RelativeDateScheduler extends NotificationScheduler<RelativeDateContext> {
    type = NotificationSchedulerType.RELATIVE_DATE;
    
    async getScheduleTime(userId: UserId, context: RelativeDateContext): Promise<Date | null> {
        return new Date(context.date.getTime() + context.offsetMinutes * 60 * 1000);
    }
}