import {
    NotificationHandler, NotificationContent,
    NotificationData,
    NotificationType, ScheduleDataResult
} from "../models/notification-handler";
import { ItemId, UserData, UserId } from "@timothyw/pat-common";
import UserManager from "../controllers/user-manager";
import ItemManager from "../controllers/item-manager";

export interface ItemDeadlineNotificationContext {
    itemId: ItemId,
    notificationNumber: number
}

export interface ItemDeadlineNotificationData extends NotificationData {
    itemId: ItemId,
    title: string,
    notificationNumber: string
}

export class ItemDeadlineNotificationHandler extends NotificationHandler<ItemDeadlineNotificationContext, ItemDeadlineNotificationData> {
    type = NotificationType.ITEM_DEADLINE;

    protected async getScheduleData(userId: UserId, context: ItemDeadlineNotificationContext): ScheduleDataResult<ItemDeadlineNotificationData> {
        const { itemId } = context;
        console.log(`scheduling notifications for user ${userId} and item ${itemId}`);
        try {
            const user = await UserManager.getInstance().getById(userId);
            const item = await ItemManager.getInstance().getById(itemId);

            if (!user) {
                console.log(`user ${userId} not found`);
                return;
            }

            if (!item) {
                console.log(`item ${itemId} not found`);
                return;
            }

            if (!item.dueDate) {
                console.log(`item ${itemId} does not have a due date`);
                return;
            }

            let scheduledTime = item.dueDate.getTime();
            if (context.notificationNumber === 1) {
                scheduledTime -= 60 * 60 * 1000;
            } else if (context.notificationNumber === 2) {
                scheduledTime -= 15 * 60 * 1000;
            } else if (context.notificationNumber === 3) {
                scheduledTime -= 3 * 60 * 1000;
            } else {
                console.log(`notification number ${context.notificationNumber} is not valid, cancelling notification`);
                return;
            }

            const data = [];
            const dataItem = {
                userId,
                scheduledTime: String(scheduledTime),
                itemId,
                title: `${context.notificationNumber}. ${item.name}`,
                notificationNumber: String(context.notificationNumber)
            };

            data.push(dataItem);
            return data;
        } catch (error) {
            console.log(`error scheduling notifications: ${error}`)
        }
    }

    async getContent(_userId: UserId, data: ItemDeadlineNotificationData): Promise<NotificationContent | null> {
        const item = await ItemManager.getInstance().getById(data.itemId);

        if (!item) {
            console.log(`item ${data.itemId} not found`);
            return null;
        }

        if (!item.dueDate) {
            console.log(`item ${data.itemId} does not have a due date, cancelling notification`);
            return null;
        }

        if (item.completed) {
            console.log(`item ${data.itemId} is completed, cancelling notification`);
            return null;
        }

        let title;
        let body;
        if (data.notificationNumber === "1") {
            title = `1 Hour Reminder`;
            body = `"${item.name}" is due in 1 hour`;
        } else if (data.notificationNumber === "2") {
            title = `15 Minutes Warning!!!`;
            body = `"${item.name}" is due in 15 minutes`;
        } else if (data.notificationNumber === "3") {
            title = `This is your last chance.`;
            body = `"${item.name}" is due in 3 minutes`;
        } else {
            console.log(`notification number ${data.notificationNumber} is not valid, cancelling notification`);
            return null;
        }

        return {
            title,
            body
        }
    }

    async onApiStart(): Promise<void> {
        const users: UserData[] = await UserManager.getInstance().getAllWithNotifications();
        for (const user of users) {
            const items = await ItemManager.getInstance().getAllByUser(user._id as UserId);
            for (const item of items) {
                if (item.dueDate) {
                    await this.schedule(String(user._id) as UserId, {
                        itemId: item._id,
                        notificationNumber: 1
                    });
                } else {
                    console.log(`item ${item._id} does not have a due date, skipping notification`);
                }
            }
        }
    }

    async onPostSend(data: ItemDeadlineNotificationData): Promise<void> {
        const notificationNumber = Number(data.notificationNumber);
        if (notificationNumber >= 3) return;
        await this.schedule(data.userId, {
            itemId: data.itemId,
            notificationNumber: notificationNumber + 1
        });
    }
}