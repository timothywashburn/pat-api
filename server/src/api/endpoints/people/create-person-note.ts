import { ApiEndpoint } from '../../types';
import PersonNoteManager from '../../../controllers/person-note-manager';
import { z } from 'zod';
import {
    CreatePersonNoteRequest,
    createPersonNoteRequestSchema,
    CreatePersonNoteResponse,
    Serializer
} from '@timothyw/pat-common';

export const createPersonNoteEndpoint: ApiEndpoint<CreatePersonNoteRequest, CreatePersonNoteResponse> = {
    path: '/api/people/notes',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = createPersonNoteRequestSchema.parse(req.body);
            const userId = req.auth!.userId!;

            const personNote = await PersonNoteManager.getInstance().create(userId, data);

            res.json({
                success: true,
                data: {
                    personNote: Serializer.serializePersonNoteData(personNote)
                }
            });
        } catch (error) {
            let message = 'Failed to create person note';
            if (error instanceof z.ZodError) {
                message = error.errors[0].message;
            }
            res.status(400).json({ success: false, error: message });
        }
    }
};