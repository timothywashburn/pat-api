import { ApiEndpoint } from '../../types';
import ThoughtManager from '../../../controllers/thought-manager';
import { z } from 'zod';
import {
    CreateThoughtRequest,
    createThoughtRequestSchema,
    CreateThoughtResponse,
    Serializer
} from "@timothyw/pat-common";

export const createThoughtEndpoint: ApiEndpoint<CreateThoughtRequest, CreateThoughtResponse> = {
    path: '/api/thoughts',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = createThoughtRequestSchema.parse(req.body);
            const userId = req.auth!.userId!;

            const thought = await ThoughtManager.getInstance().create(userId, {
                content: data.content
            });

            res.json({
                success: true,
                thought: Serializer.serialize(thought)
            });
        } catch (error) {
            let message = 'Failed to create thought';
            if (error instanceof z.ZodError) {
                message = error.errors[0].message;
            }
            res.status(400).json({ success: false, error: message });
        }
    }
};