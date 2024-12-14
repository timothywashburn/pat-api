import { ApiEndpoint } from '../../types';
import ThoughtManager from '../../../controllers/thought-manager';
import { Types } from 'mongoose';
import { z } from 'zod';

const createThoughtSchema = z.object({
    content: z.string().min(1)
});

type CreateThoughtRequest = z.infer<typeof createThoughtSchema>;

interface CreateThoughtResponse {
    thought: {
        id: string;
        content: string;
    };
}

export const createThoughtEndpoint: ApiEndpoint<CreateThoughtRequest, CreateThoughtResponse> = {
    path: '/api/thoughts',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = createThoughtSchema.parse(req.body);
            const userId = new Types.ObjectId(req.auth!.userId);

            const thought = await ThoughtManager.getInstance().create(userId, {
                content: data.content
            });

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
            let message = 'Failed to create thought';
            if (error instanceof z.ZodError) {
                message = error.errors[0].message;
            }
            res.status(400).json({ success: false, error: message });
        }
    }
};