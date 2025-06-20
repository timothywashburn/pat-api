import { ApiEndpoint } from '../../types';
import PersonManager from '../../../controllers/person-manager';
import { z } from 'zod';
import { CreatePersonRequest, createPersonRequestSchema, CreatePersonResponse } from "@timothyw/pat-common";

export const createPersonEndpoint: ApiEndpoint<CreatePersonRequest, CreatePersonResponse> = {
    path: '/api/people',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = createPersonRequestSchema.parse(req.body);
            const userId = req.auth!.userId!;

            const person = await PersonManager.getInstance().create(userId, data);

            res.json({
                success: true,
                data: {
                    person
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