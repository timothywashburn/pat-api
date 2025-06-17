import {
    NotificationHandler, NotificationContent,
    NotificationData,
    NotificationType, ScheduleDataResult
} from "../models/notification-handler";
import { UserData, UserId } from "@timothyw/pat-common";
import UserManager from "../controllers/user-manager";
import ThoughtManager from "../controllers/thought-manager";
import { isBefore, format, addDays } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export interface ClearInboxNotificationContext {
    dateString: string;
}

export interface ClearInboxNotificationData extends NotificationData {
    dateString: string;
}

/**
 * Creates a UTC Date representing 9 PM on the given date in the specified timezone
 */
function get9PMInTimezone(dateString: string, timezone: string): Date {
    // Create a local date at 9 PM
    const localDateTime = new Date(`${dateString}T21:00:00`);
    // Convert to UTC
    return fromZonedTime(localDateTime, timezone);
}

/**
 * Gets the next 9 PM in the user's timezone (today if we haven't passed it, tomorrow if we have)
 */
function getNext9PMInTimezone(timezone: string): { utcDate: Date, dateString: string } {
    const now = new Date();
    const localNow = toZonedTime(now, timezone);
    
    // Get today at 9 PM in the user's timezone
    const todayDateString = format(localNow, 'yyyy-MM-dd');
    const today9PM = get9PMInTimezone(todayDateString, timezone);
    
    // If 9 PM today hasn't passed yet, schedule for today
    if (!isBefore(today9PM, now)) {
        return {
            utcDate: today9PM,
            dateString: todayDateString
        };
    }
    
    // Otherwise schedule for tomorrow
    const tomorrow = addDays(localNow, 1);
    const tomorrowDateString = format(tomorrow, 'yyyy-MM-dd');
    const tomorrow9PM = get9PMInTimezone(tomorrowDateString, timezone);
    
    return {
        utcDate: tomorrow9PM,
        dateString: tomorrowDateString
    };
}

export class ClearInboxNotificationHandler extends NotificationHandler<ClearInboxNotificationContext, ClearInboxNotificationData> {
    type = NotificationType.CLEAR_INBOX;

    protected async getScheduleData(userId: UserId, context: ClearInboxNotificationContext): ScheduleDataResult<ClearInboxNotificationData> {
        console.log(`scheduling clear inbox notification for user ${userId}`);
        try {
            const user = await UserManager.getInstance().getById(userId);

            if (!user) {
                console.log(`user ${userId} not found`);
                return;
            }

            const userTimezone = user.timezone || 'America/Los_Angeles';
            const utc9PM = get9PMInTimezone(context.dateString, userTimezone);

            const data = {
                userId,
                scheduledTime: String(utc9PM.getTime()),
                dateString: context.dateString
            };

            return [data];
        } catch (error) {
            console.log(`error scheduling notifications: ${error}`);
        }
    }

    async getContent(userId: UserId, _data: ClearInboxNotificationData): Promise<NotificationContent | null> {
        const thoughts = await ThoughtManager.getInstance().getAllByUser(userId);

        if (thoughts.length === 0) {
            console.log(`user ${userId} has no thoughts; cancelling notification`);
            return null;
        }

        return {
            title: "Clear your inbox!",
            body: `You have ${thoughts.length} thought${thoughts.length == 1 ? "" : "s"} in your inbox.`
        }
    }

    async onApiStart(): Promise<void> {
        const users: UserData[] = await UserManager.getInstance().getAllWithNotifications();
        for (const user of users) {
            const userTimezone = user.timezone || 'America/Los_Angeles';
            const { dateString } = getNext9PMInTimezone(userTimezone);

            await this.schedule(String(user._id) as UserId, {
                dateString
            });

            console.log(`[notifications] starting with dateString ${dateString} for user ${user._id}`);
        }
    }

    async onPostSend(data: ClearInboxNotificationData): Promise<void> {
        const user = await UserManager.getInstance().getById(data.userId);
        if (!user) return;
        
        const userTimezone = user.timezone || 'America/Los_Angeles';
        console.log(`[notifications] rescheduling clear inbox notification for user ${data.userId} with dateString ${data.dateString}`);
        console.log(`[notifications] user timezone: ${userTimezone}`);
        
        // Add one day to the current date string
        const currentDate = new Date(`${data.dateString}T00:00:00`);
        const nextDate = addDays(currentDate, 1);
        const nextDateString = format(nextDate, 'yyyy-MM-dd');
        
        console.log(`[notifications] scheduling for next date: ${nextDateString}`);
        
        await this.schedule(data.userId, {
            dateString: nextDateString
        });

        console.log(`[notifications] rescheduled clear inbox notification for user ${data.userId} with dateString ${nextDateString}`);
    }
}