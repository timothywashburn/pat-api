import { ApiEndpoint } from '../../types';
import PersonNoteManager from '../../../controllers/person-note-manager';
import { z } from 'zod';
import {
    PersonNoteId, Serializer,
    UpdatePersonNoteRequest,
    updatePersonNoteRequestSchema,
    UpdatePersonNoteResponse
} from "@timothyw/pat-common";

export const updatePersonNoteEndpoint: ApiEndpoint<UpdatePersonNoteRequest, UpdatePersonNoteResponse> = {
    path: '/api/people/notes/:personNoteId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            console.log('Update person note request:', req.body, req.params);
            const data = updatePersonNoteRequestSchema.parse(req.body);
            const personNoteId = req.params.personNoteId as PersonNoteId;

            const personNote = await PersonNoteManager.getInstance().update(req.auth!, personNoteId, data);

            if (!personNote) {
                res.status(404).json({ success: false, error: 'Person note not found' });
                return;
            }

            res.json({
                success: true,
                data: {
                    personNote: Serializer.serializePersonNoteData(personNote)
                }
            });
        } catch (error) {
            let message = 'Failed to update person note';
            if (error instanceof z.ZodError) {
                message = error.errors[0].message;
            }
            res.status(400).json({ success: false, error: message });
        }
    }
};