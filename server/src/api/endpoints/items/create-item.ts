import { ApiEndpoint } from '../../types';
import ItemManager from '../../../controllers/item-manager';
import { z } from 'zod';
import {
    CreateItemRequest,
    createItemRequestSchema,
    CreateItemResponse, ItemId, Serializer
} from "@timothyw/pat-common";
import NotificationManager from "../../../controllers/notification-manager";
import { NotificationType } from "../../../models/notification-handler";

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
                dueDate: data.dueDate,
                notes: data.notes,
                urgent: data.urgent,
                category: data.category,
                type: data.type
            });

            if (!item) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to create item'
                });
                return;
            }

            // TODO: figure out a better way to handle objectids as itemids
            await NotificationManager.getHandler(NotificationType.ITEM_DEADLINE).schedule(userId, {
                itemId: item._id,
                notificationNumber: 1
            });

            res.json({
                success: true,
                data: {
                    item: Serializer.serializeItemData(item)
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