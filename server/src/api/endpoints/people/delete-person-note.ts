import { ApiEndpoint } from '../../types';
import PersonNoteManager from '../../../controllers/person-note-manager';
import { DeletePersonNoteResponse, PersonNoteId } from "@timothyw/pat-common";

export const deletePersonNoteEndpoint: ApiEndpoint<undefined, DeletePersonNoteResponse> = {
    path: '/api/people/notes/:personNoteId',
    method: 'delete',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const personNoteId = req.params.personNoteId as PersonNoteId;
            const deleted = await PersonNoteManager.getInstance().delete(personNoteId);

            if (!deleted) {
                res.status(404).json({ success: false, error: 'Person note not found' });
                return;
            }

            res.json({
                success: true,
                data: {
                    success: true
                }
            });
        } catch (error) {
            res.status(400).json({ success: false, error: 'Failed to delete person note' });
        }
    }
};