import { ApiEndpoint } from '../../types';
import PersonManager from '../../../controllers/person-manager';
import { Types } from 'mongoose';
import { z } from 'zod';
import { PersonId, UpdatePersonRequest, updatePersonRequestSchema, UpdatePersonResponse } from "@timothyw/pat-common";

export const updatePersonEndpoint: ApiEndpoint<UpdatePersonRequest, UpdatePersonResponse> = {
    path: '/api/people/:personId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = updatePersonRequestSchema.parse(req.body);
            const personId = req.params.personId as PersonId;

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