import { ApiEndpoint } from '../../types';
import ListItemManager from '../../../controllers/list-item-manager';
import { z } from 'zod';
import {
    UpdateListItemRequest,
    UpdateListItemResponse,
    ListItemId,
    updateListItemRequestSchema,
    Serializer
} from "@timothyw/pat-common";

export const updateListItemEndpoint: ApiEndpoint<UpdateListItemRequest, UpdateListItemResponse> = {
    path: '/api/list-items/:listItemId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const listItemId = req.params.listItemId as ListItemId;
            const data = updateListItemRequestSchema.parse(req.body);

            const listItem = await ListItemManager.getInstance().update(req.patAuth!.userId, listItemId, data);

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
            console.error('Error updating list item:', error);
            let message = 'Failed to update list item';

            if (error instanceof z.ZodError) {
                message = error.issues[0].message;
            }

            res.status(400).json({
                success: false,
                error: message
            });
        }
    }
};