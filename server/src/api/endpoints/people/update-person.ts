import { ApiEndpoint } from '../../types';
import PersonManager from '../../../controllers/person-manager';
import { Types } from 'mongoose';
import { z } from 'zod';

const updatePersonSchema = z.object({
    name: z.string().min(1).optional(),
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

type UpdatePersonRequest = z.infer<typeof updatePersonSchema>;

interface UpdatePersonResponse {
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

export const updatePersonEndpoint: ApiEndpoint<UpdatePersonRequest, UpdatePersonResponse> = {
    path: '/api/people/:personId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = updatePersonSchema.parse(req.body);
            const personId = new Types.ObjectId(req.params.personId);

            const person = await PersonManager.getInstance().update(personId, data);

            if (!person) {
                res.status(404).json({ success: false, error: 'Person not found' });
                return;
            }

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
            let message = 'Failed to update person';
            if (error instanceof z.ZodError) {
                message = error.errors[0].message;
            }
            res.status(400).json({ success: false, error: message });
        }
    }
};