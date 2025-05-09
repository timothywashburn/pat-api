import {
    NotificationHandler, NotificationContent,
    NotificationData,
    NotificationType, ScheduleDataResult, NotificationContext
} from "../models/notification-handler";
import { UserData, UserId } from "@timothyw/pat-common";
import UserManager from "../controllers/user-manager";
import ThoughtManager from "../controllers/thought-manager";
import { DateUtils } from "../utils/date-utils";

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

            let date = DateUtils.setTime(new Date(), 21, 0);
            if (DateUtils.inPast(date)) date = DateUtils.addDays(date, 1);

            const data = {
                userId,
                scheduledTime: date.getTime()
            };

            return [data];
        } catch (error) {
            console.log(`error scheduling notifications: ${error}`);
        }
    }

    protected async getContent(userId: UserId, _data: NotificationData): Promise<NotificationContent | null> {
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

    protected async onPostSend(userId: UserId): Promise<void> {
        await this.schedule(userId, {});
    }
}