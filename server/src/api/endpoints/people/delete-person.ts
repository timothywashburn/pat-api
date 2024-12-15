import { ApiEndpoint } from '../../types';
import PersonManager from '../../../controllers/person-manager';
import { Types } from 'mongoose';

interface DeletePersonResponse {
    deleted: boolean;
}

export const deletePersonEndpoint: ApiEndpoint<unknown, DeletePersonResponse> = {
    path: '/api/people/:personId',
    method: 'delete',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const personId = new Types.ObjectId(req.params.personId);
            const deleted = await PersonManager.getInstance().delete(personId);

            if (!deleted) {
                res.status(404).json({ success: false, error: 'Person not found' });
                return;
            }

            res.json({
                success: true,
                data: {
                    deleted: true
                }
            });
        } catch (error) {
            res.status(400).json({ success: false, error: 'Failed to delete person' });
        }
    }
};