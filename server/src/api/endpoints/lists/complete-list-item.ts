import { ApiEndpoint } from '../../types';
import ListItemManager from '../../../controllers/list-item-manager';
import { z } from 'zod';
import {
    CompleteListItemRequest,
    completeListItemRequestSchema,
    CompleteListItemResponse,
    Serializer,
    ListItemId
} from "@timothyw/pat-common";

export const completeListItemEndpoint: ApiEndpoint<CompleteListItemRequest, CompleteListItemResponse> = {
    path: '/api/list-items/:listItemId/complete',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const listItemId = req.params.listItemId as ListItemId;
            const data = completeListItemRequestSchema.parse(req.body);

            const listItem = await ListItemManager.getInstance().setCompleted(listItemId, data.completed);

            if (!listItem) {
                res.status(404).json({
                    success: false,
                    error: 'List item not found'
                });
                return;
            }

            res.json({
                success: true,
                listItem: Serializer.serialize(listItem)
            });
        } catch (error) {
            let message = 'Failed to update list completion status';

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