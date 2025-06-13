import {
    NotificationHandler, NotificationContent,
    NotificationData,
    NotificationType, ScheduleDataResult, NotificationContext
} from "../models/notification-handler";
import { UserData, UserId } from "@timothyw/pat-common";
import UserManager from "../controllers/user-manager";
import ThoughtManager from "../controllers/thought-manager";
import { toZonedTime } from 'date-fns-tz';
import { setHours, setMinutes, setSeconds, addDays, isAfter, setMilliseconds } from 'date-fns';

export class ClearInboxNotificationHandler extends NotificationHandler {
    type = NotificationType.CLEAR_INBOX;

    protected async getScheduleData(userId: UserId, _context: NotificationContext): ScheduleDataResult<NotificationData> {
        console.log(`scheduling clear inbox notification for user ${userId}`);
        try {
            const user = await UserManager.getInstance().getById(userId);

            if (!user) {
                console.log(`user ${userId} not found`);
                return;
            }

            const userTimezone = user.timezone || 'America/Los_Angeles';

            const now = new Date();
            const userNow = toZonedTime(now, userTimezone);

            let scheduledDate = setHours(setMinutes(setSeconds(setMilliseconds(userNow, 0), 0), 0), 21);

            if (isAfter(userNow, scheduledDate)) {
                scheduledDate = addDays(scheduledDate, 1);
            }

            const data = {
                userId,
                scheduledTime: String(scheduledDate.getTime())
                // scheduledTime: new Date().getTime() + 10_000
            };

            return [data];
        } catch (error) {
            console.log(`error scheduling notifications: ${error}`);
        }
    }

    async getContent(userId: UserId, _data: NotificationData): Promise<NotificationContent | null> {
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
        for (const user of users) await this.schedule(String(user._id) as UserId, {});
    }

    async onPostSend(data: NotificationData): Promise<void> {
        await this.schedule(data.userId, {});
    }
}