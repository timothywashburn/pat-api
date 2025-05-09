import {
    NotificationHandler, NotificationContent,
    NotificationData,
    NotificationType, ScheduleDataResult
} from "../models/notification-handler";
import { UserId } from "@timothyw/pat-common";
import UserManager from "../controllers/user-manager";
import ThoughtManager from "../controllers/thought-manager";

export class ClearInboxNotificationHandler extends NotificationHandler {
    type = NotificationType.CLEAR_INBOX;

    protected async getScheduleData(userId: UserId): ScheduleDataResult<NotificationData> {
        console.log(`scheduling clear inbox notification for user ${userId}`);
        try {
            const user = await UserManager.getInstance().getById(userId);

            if (!user) {
                console.log(`user ${userId} not found`);
                return;
            }

            let scheduledTime = new Date().getTime() + 30 * 1000;

            const data = {
                userId,
                scheduledTime
            };

            return [data];
        } catch (error) {
            console.log(`error scheduling notifications: ${error}`);
        }
    }

    protected async getContent(userId: UserId): Promise<NotificationContent> {
        const thoughts = await ThoughtManager.getInstance().getAllByUser(userId);

        return {
            title: "Clear your inbox!",
            body: `You have ${thoughts.length} thoughts in your inbox.`
        }
    }

    protected async onPostSend(userId: UserId): Promise<void> {
        await this.schedule(userId, {});
    }
}

export const clearInboxNotificationHandler = new ClearInboxNotificationHandler();