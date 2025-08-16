import { ApiEndpoint } from '../../types';
import PersonManager from '../../../controllers/person-manager';
import { Types } from 'mongoose';
import { DeletePersonResponse, PersonId } from "@timothyw/pat-common";

export const deletePersonEndpoint: ApiEndpoint<undefined, DeletePersonResponse> = {
    path: '/api/people/:personId',
    method: 'delete',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const personId = req.params.personId as PersonId;
            const deleted = await PersonManager.getInstance().delete(personId);

            if (!deleted) {
                res.status(404).json({ success: false, error: 'Person not found' });
                return;
            }

            res.json({
                success: true,
            });
        } catch (error) {
            res.status(400).json({ success: false, error: 'Failed to delete person' });
        }
    }
};