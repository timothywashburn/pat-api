import { ApiEndpoint } from '../../types';
import ItemManager from '../../../controllers/item-manager';
import { z } from 'zod';
import {
    ItemId, Serializer,
    UpdateItemRequest,
    updateItemRequestSchema,
    UpdateItemResponse
} from "@timothyw/pat-common";

export const updateItemEndpoint: ApiEndpoint<UpdateItemRequest, UpdateItemResponse> = {
    path: '/api/items/:itemId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = updateItemRequestSchema.parse(req.body);
            const itemId = req.params.itemId as ItemId;

            const item = await ItemManager.getInstance().update(req.auth!, itemId, {
                name: data.name,
                dueDate: data.dueDate,
                notes: data.notes,
                urgent: data.urgent,
                category: data.category,
                type: data.type
            });

            if (!item) {
                res.status(404).json({
                    success: false,
                    error: 'Item not found'
                });
                return;
            }

            res.json({
                success: true,
                item: Serializer.serializeItemData(item)
            });
        } catch (error) {
            let message = 'Failed to update item';

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