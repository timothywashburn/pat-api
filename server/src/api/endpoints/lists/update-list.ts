import { ApiEndpoint } from '../../types';
import ListManager from '../../../controllers/list-manager';
import { z } from 'zod';
import {
    UpdateListRequest,
    UpdateListResponse,
    ListId,
    updateListRequestSchema, Serializer
} from "@timothyw/pat-common";

export const updateListEndpoint: ApiEndpoint<UpdateListRequest, UpdateListResponse> = {
    path: '/api/lists/:listId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const listId = req.params.listId as ListId;
            const data = updateListRequestSchema.parse(req.body);

            const list = await ListManager.getInstance().update(req.auth!, listId, data);

            if (!list) {
                res.status(404).json({
                    success: false,
                    error: 'List not found'
                });
                return;
            }

            res.json({
                success: true,
                list: Serializer.serialize(list)
            });
        } catch (error) {
            let message = 'Failed to update list';

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