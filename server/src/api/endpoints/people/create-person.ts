import { ApiEndpoint } from '../../types';
import PersonManager from '../../../controllers/person-manager';
import { Types } from 'mongoose';
import { z } from 'zod';

const createPersonSchema = z.object({
    name: z.string().min(1),
    properties: z.array(z.object({
        key: z.string().min(1),
        value: z.string().min(1),
        order: z.number()
    })).optional(),
    notes: z.array(z.object({
        content: z.string().min(1),
        order: z.number()
    })).optional()
});

type CreatePersonRequest = z.infer<typeof createPersonSchema>;

interface CreatePersonResponse {
    person: {
        id: string;
        name: string;
        properties: Array<{
            key: string;
            value: string;
            order: number;
        }>;
        notes: Array<{
            content: string;
            order: number;
            createdAt: string;
            updatedAt: string;
        }>;
    };
}

export const createPersonEndpoint: ApiEndpoint<CreatePersonRequest, CreatePersonResponse> = {
    path: '/api/people',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = createPersonSchema.parse(req.body);
            const userId = new Types.ObjectId(req.auth!.userId);

            const person = await PersonManager.getInstance().create(userId, data);

            res.json({
                success: true,
                data: {
                    person: {
                        id: person._id.toString(),
                        name: person.name,
                        properties: person.properties,
                        notes: person.notes.map(n => ({
                            ...n,
                            createdAt: n.createdAt.toISOString(),
                            updatedAt: n.updatedAt.toISOString()
                        }))
                    }
                }
            });
        } catch (error) {
            let message = 'Failed to create person';
            if (error instanceof z.ZodError) {
                message = error.errors[0].message;
            }
            res.status(400).json({ success: false, error: message });
        }
    }
};