import { ApiEndpoint } from '../../types';
import PersonManager from '../../../controllers/person-manager';
import { z } from 'zod';
import {
    PersonId,
    Serializer,
    UpdatePersonRequest,
    updatePersonRequestSchema,
    UpdatePersonResponse
} from "@timothyw/pat-common";

export const updatePersonEndpoint: ApiEndpoint<UpdatePersonRequest, UpdatePersonResponse> = {
    path: '/api/people/:personId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = updatePersonRequestSchema.parse(req.body);
            const personId = req.params.personId as PersonId;

            const person = await PersonManager.getInstance().update(req.auth!, personId, data);

            if (!person) {
                res.status(404).json({ success: false, error: 'Person not found' });
                return;
            }

            res.json({
                success: true,
                person: Serializer.serializePerson(person)
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