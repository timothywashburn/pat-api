import {
    NotificationHandler, NotificationContent,
    NotificationData,
    NotificationType, ScheduleDataResult
} from "../models/notification-handler";
import { DateOnlyString, DateString, UserData, UserId } from "@timothyw/pat-common";
import UserManager from "../controllers/user-manager";
import ThoughtManager from "../controllers/thought-manager";
import { format, addDays } from 'date-fns';
import DateUtils from "../utils/date-utils";

export interface ClearInboxNotificationContext {
    dateString: DateOnlyString;
}

export interface ClearInboxNotificationData extends NotificationData {
    dateString: DateOnlyString;
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
            const utc9PM = DateUtils.dateInTimezoneAsUTC(context.dateString, 21, 0, 0, userTimezone);

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
            const utcTime = DateUtils.nextTimeInTimezoneAsUTC(21, 0, 0, userTimezone);

            await this.schedule(String(user._id) as UserId, {
                dateString: DateUtils.toLocalDateOnlyString(utcTime, userTimezone)
            });
        }
    }

    async onPostSend(data: ClearInboxNotificationData): Promise<void> {
        const user = await UserManager.getInstance().getById(data.userId);
        if (!user) return;

        const currentDate = new Date(`${data.dateString}T00:00:00`);
        const nextDate = addDays(currentDate, 1);
        const nextDateString = format(nextDate, 'yyyy-MM-dd') as DateOnlyString;

        await this.schedule(data.userId, {
            dateString: nextDateString
        });
    }
}