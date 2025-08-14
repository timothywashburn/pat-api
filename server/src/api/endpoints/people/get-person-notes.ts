import { ApiEndpoint } from '../../types';
import PersonNoteManager from '../../../controllers/person-note-manager';
import { GetPersonNotesResponse, Serializer } from "@timothyw/pat-common";

export const getPersonNotesEndpoint: ApiEndpoint<undefined, GetPersonNotesResponse> = {
    path: '/api/people/notes',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const personNotes = await PersonNoteManager.getInstance().getAllByUser(req.auth!.userId!);
            res.json({
                success: true,
                personNotes: personNotes.map(note => Serializer.serialize(note))
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch person notes' });
        }
    }
};