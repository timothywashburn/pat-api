import { ApiEndpoint } from '../../types';
import ThoughtManager from '../../../controllers/thought-manager';
import { Types } from 'mongoose';
import { z } from 'zod';

const updateThoughtSchema = z.object({
    content: z.string().min(1)
});

type UpdateThoughtRequest = z.infer<typeof updateThoughtSchema>;

interface UpdateThoughtResponse {
    thought: {
        id: string;
        content: string;
    };
}

export const updateThoughtEndpoint: ApiEndpoint<UpdateThoughtRequest, UpdateThoughtResponse> = {
    path: '/api/thoughts/:thoughtId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = updateThoughtSchema.parse(req.body);
            const thoughtId = new Types.ObjectId(req.params.thoughtId);

            const thought = await ThoughtManager.getInstance().update(thoughtId, data);

            if (!thought) {
                res.status(404).json({ success: false, error: 'Thought not found' });
                return;
            }

            res.json({
                success: true,
                data: {
                    thought: {
                        id: thought._id.toString(),
                        content: thought.content
                    }
                }
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