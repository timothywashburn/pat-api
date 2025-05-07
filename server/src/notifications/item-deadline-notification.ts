import {
    NotificationData,
    NotificationHandler,
    NotificationType
} from "../models/notification-handler";
import { ItemId } from "@timothyw/pat-common";
import UserManager from "../controllers/user-manager";
import ItemManager from "../controllers/item-manager";
import { randomBytes } from "crypto";
import RedisManager from "../controllers/redis-manager";

export interface ItemDeadlineNotificationData extends NotificationData {
    itemId: ItemId
}

export interface ItemDeadlineNotificationScheduleData {
    itemId: ItemId
}

export const itemDeadlineNotification: NotificationHandler<ItemDeadlineNotificationScheduleData> = {
    type: NotificationType.ITEM_DEADLINE,
    schedule: async (userId, data) => {
        const { itemId } = data;
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

            const notificationID = randomBytes(16).toString('base64url');
            // const scheduledTime = item.dueDate.getTime() - 60 * 60 * 1000;
            const scheduledTime = new Date().getTime() + 10 * 60 * 1000;

            const data: ItemDeadlineNotificationData = {
                itemId,
                userId,
                scheduledTime,
                devName: item.name
            };

            const client = RedisManager.getInstance().getClient();
            await client.hSet(`notification:${notificationID}`, { ...data });
            await client.zAdd(`user:${userId}:notifications`, {
                value: notificationID,
                score: scheduledTime
            });
            await client.zAdd('global:notifications', {
                value: notificationID,
                score: scheduledTime
            });
        } catch (error) {
            console.log(`error scheduling notifications: ${error}`)
        }
    },
};