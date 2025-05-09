import { ApiEndpoint } from '../../types';
import ItemManager from '../../../controllers/item-manager';
import { z } from 'zod';
import { CreateItemRequest, createItemRequestSchema, CreateItemResponse, ItemId } from "@timothyw/pat-common";
import NotificationManager from "../../../controllers/notification-manager";
import { NotificationType } from "../../../models/notification-handler";
// import { itemDeadlineNotificationHandler } from "../../../notifications/item-deadline-notification";

export const createItemEndpoint: ApiEndpoint<CreateItemRequest, CreateItemResponse> = {
    path: '/api/items',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = createItemRequestSchema.parse(req.body);
            const userId = req.auth!.userId!;

            const item = await ItemManager.getInstance().create(userId, {
                name: data.name,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                notes: data.notes,
                urgent: data.urgent,
                category: data.category ?? null,
                type: data.type ?? null
            });

            // TODO: figure out a better way to handle objectids as itemids
            // await NotificationManager.getHandler(NotificationType.ITEM_DEADLINE).schedule(userId, {
            //     itemId: String(item._id) as ItemId
            // });

            res.json({
                success: true,
                data: {
                    item: {
                        id: item._id.toString(),
                        name: item.name,
                        dueDate: item.dueDate?.toISOString(),
                        notes: item.notes,
                        completed: item.completed,
                        urgent: item.urgent,
                        category: item.category ?? undefined,
                        type: item.type ?? undefined
                    }
                }
            });
        } catch (error) {
            let message = 'Failed to create item';

            if (error instanceof z.ZodError) {
                message = error.errors[0].message;
            }

            res.status(400).json({
                success: false,
                error: message
            });
        }
    }
};