import {
    NotificationHandler, NotificationContent,
    NotificationData,
    NotificationType, ScheduleDataResult
} from "../models/notification-handler";
import { ItemId, UserId } from "@timothyw/pat-common";
import UserManager from "../controllers/user-manager";
import ItemManager from "../controllers/item-manager";

export interface ItemDeadlineNotificationContext {
    itemId: ItemId
}

export interface ItemDeadlineNotificationData extends NotificationData {
    itemId: ItemId,
    title: string
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

            // const dueDate = item.dueDate.getTime();
            let scheduledTime = new Date().getTime() + 20 * 60 * 1000;

            const data = []
            for (let i = 0; i < 1; i++, scheduledTime += 5 * 1000) {
                const dataItem = {
                    userId,
                    scheduledTime,
                    itemId,
                    title: `${i}. ${item.name}`,
                };

                data.push(dataItem);
            }
            return data;
        } catch (error) {
            console.log(`error scheduling notifications: ${error}`)
        }
    }

    protected async getContent(userId: UserId, data: ItemDeadlineNotificationData): Promise<NotificationContent> {
        const item = await ItemManager.getInstance().getById(data.itemId);

        // TODO: cancel notification instead (this should trigger if you delete the item after a notification is queued or tbh scheduled rn
        if (!item) {
            console.log(`item ${data.itemId} not found`);
            return {
                title: "Item not found",
                body: "The item you are trying to access does not exist."
            };
        }

        return {
            title: data.title,
            body: `The item "${item.name}" is due soon.`
        }
    }
}