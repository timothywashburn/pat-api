import { ApiEndpoint } from '../../types';
import ThoughtManager from '../../../controllers/thought-manager';
import { Types } from 'mongoose';

interface DeleteThoughtResponse {
    deleted: boolean;
}

export const deleteThoughtEndpoint: ApiEndpoint<unknown, DeleteThoughtResponse> = {
    path: '/api/thoughts/:thoughtId',
    method: 'delete',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const thoughtId = new Types.ObjectId(req.params.thoughtId);
            const deleted = await ThoughtManager.getInstance().delete(thoughtId);

            if (!deleted) {
                res.status(404).json({ success: false, error: 'Thought not found' });
                return;
            }

            res.json({
                success: true,
                data: {
                    deleted: true
                }
            });
        } catch (error) {
            res.status(400).json({ success: false, error: 'Failed to delete thought' });
        }
    }
};