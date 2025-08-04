import { ApiEndpoint } from '../../types';
import ThoughtManager from '../../../controllers/thought-manager';
import { z } from 'zod';
import {
    Serializer,
    ThoughtId,
    UpdateThoughtRequest,
    updateThoughtRequestSchema,
    UpdateThoughtResponse
} from "@timothyw/pat-common";

export const updateThoughtEndpoint: ApiEndpoint<UpdateThoughtRequest, UpdateThoughtResponse> = {
    path: '/api/thoughts/:thoughtId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = updateThoughtRequestSchema.parse(req.body);
            const thoughtId = req.params.thoughtId as ThoughtId;

            const thought = await ThoughtManager.getInstance().update(req.auth!, thoughtId, data);

            if (!thought) {
                res.status(404).json({ success: false, error: 'Thought not found' });
                return;
            }

            res.json({
                success: true,
                thought: Serializer.serializeThoughtData(thought)
            });
        } catch (error) {
            let message = 'Failed to update thought';
            if (error instanceof z.ZodError) {
                message = error.errors[0].message;
            }
            res.status(400).json({ success: false, error: message });
        }
    }
};