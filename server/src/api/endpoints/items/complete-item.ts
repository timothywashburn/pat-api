import { ApiEndpoint } from '../../types';
import ItemManager from '../../../controllers/item-manager';
import { z } from 'zod';
import {
    CompleteItemRequest,
    completeItemRequestSchema,
    CompleteItemResponse,
    ItemId, Serializer,
} from "@timothyw/pat-common";

export const completeItemEndpoint: ApiEndpoint<CompleteItemRequest, CompleteItemResponse> = {
    path: '/api/items/:itemId/complete',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = completeItemRequestSchema.parse(req.body);
            const itemId = req.params.itemId as ItemId;
            const item = await ItemManager.getInstance().setCompleted(itemId, data.completed);

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
            let message = 'Failed to update item completion status';

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