import { ApiEndpoint } from '../../types';
import PersonManager from '../../../controllers/person-manager';
import { z } from 'zod';
import { CreatePersonRequest, createPersonRequestSchema, CreatePersonResponse, Serializer } from "@timothyw/pat-common";

export const createPersonEndpoint: ApiEndpoint<CreatePersonRequest, CreatePersonResponse> = {
    path: '/api/people',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = createPersonRequestSchema.parse(req.body);
            const userId = req.patAuth!.userId!;

            const person = await PersonManager.getInstance().create(userId, data);

            res.json({
                success: true,
                person: Serializer.serialize(person)
            });
        } catch (error) {
            let message = 'Failed to create person';
            if (error instanceof z.ZodError) {
                message = error.issues[0].message;
            }
            res.status(400).json({ success: false, error: message });
        }
    }
};