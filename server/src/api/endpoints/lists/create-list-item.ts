import { ApiEndpoint } from '../../types';
import ListItemManager from '../../../controllers/list-item-manager';
import { z } from 'zod';
import { CreateListItemRequest, createListItemRequestSchema, CreateListItemResponse, Serializer } from "@timothyw/pat-common";

export const createListItemEndpoint: ApiEndpoint<CreateListItemRequest, CreateListItemResponse> = {
    path: '/api/list-items',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = createListItemRequestSchema.parse(req.body);
            const userId = req.auth!.userId!;

            const listItem = await ListItemManager.getInstance().create(userId, {
                name: data.name,
                notes: data.notes,
                listId: data.listId
            });

            res.json({
                success: true,
                listItem: Serializer.serialize(listItem)
            });
        } catch (error) {
            let message = 'Failed to create list item';

            console.error('Error creating list item:', error);

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