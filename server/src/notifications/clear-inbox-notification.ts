import {
    NotificationHandler, NotificationContent,
    NotificationData,
    NotificationType, ScheduleDataResult
} from "../models/notification-handler";
import { UserData, UserId } from "@timothyw/pat-common";
import UserManager from "../controllers/user-manager";
import ThoughtManager from "../controllers/thought-manager";
import { isBefore } from 'date-fns';
import LocalDate from "../utils/local-date";

export interface ClearInboxNotificationContext {
    dateString: string;
}

export interface ClearInboxNotificationData extends NotificationData {
    dateString: string;
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

            const localDate = LocalDate.fromDateString(context.dateString, userTimezone);
            localDate.date.setHours(21, 0, 0, 0);

            const data = {
                userId,
                scheduledTime: String(localDate.toUTCTime()),
                dateString: localDate.toLocalYYYYMMDD()
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
            const localDate = LocalDate.now(user.timezone || 'America/Los_Angeles');
            localDate.date.setHours(21, 0, 0, 0);

            if (isBefore(localDate.toUTCDate(), new Date())) localDate.date.setDate(localDate.date.getDate() + 1);

            await this.schedule(String(user._id) as UserId, {
                dateString: localDate.toLocalYYYYMMDD()
            });

            console.log(`[notifications] starting with dateString ${localDate.toLocalYYYYMMDD()} for user ${user._id}`);
        }
    }

    async onPostSend(data: ClearInboxNotificationData): Promise<void> {
        const user = await UserManager.getInstance().getById(data.userId);
        if (!user) return;
        console.log(`[notifications] rescheduling clear inbox notification for user ${data.userId} with dateString ${data.dateString}`);
        console.log(`[notifications] user timezone: ${user.timezone || 'America/Los_Angeles'}`);
        const localDate = LocalDate.fromDateString(data.dateString, user.timezone || 'America/Los_Angeles');
        console.log(`[notifications] current date (pre): ${localDate.date.getDate()}`);
        localDate.date.setDate(localDate.date.getDate() + 1);
        console.log(`[notifications] current date (post): ${localDate.date.getDate()}`);
        await this.schedule(data.userId, {
            dateString: localDate.toLocalYYYYMMDD()
        });

        console.log(`[notifications] rescheduled clear inbox notification for user ${data.userId} with dateString ${localDate.toLocalYYYYMMDD()}`);
    }
}