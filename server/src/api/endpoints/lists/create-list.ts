import { ApiEndpoint } from '../../types';
import ListManager from '../../../controllers/list-manager';
import { z } from 'zod';
import {
    CreateListRequest,
    createListRequestSchema,
    CreateListResponse,
    Serializer
} from "@timothyw/pat-common";

export const createListEndpoint: ApiEndpoint<CreateListRequest, CreateListResponse> = {
    path: '/api/lists',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = createListRequestSchema.parse(req.body);
            const userId = req.auth!.userId!;

            const list = await ListManager.getInstance().create(userId, {
                name: data.name,
                type: data.type
            });

            res.json({
                success: true,
                list: Serializer.serializeListData(list)
            });
        } catch (error) {
            let message = 'Failed to create list';

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