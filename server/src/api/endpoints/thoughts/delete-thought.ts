import { ApiEndpoint } from '../../types';
import ThoughtManager from '../../../controllers/thought-manager';
import { DeleteThoughtResponse, ThoughtId } from "@timothyw/pat-common";

export const deleteThoughtEndpoint: ApiEndpoint<undefined, DeleteThoughtResponse> = {
    path: '/api/thoughts/:thoughtId',
    method: 'delete',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const thoughtId = req.params.thoughtId as ThoughtId;
            const deleted = await ThoughtManager.getInstance().delete(thoughtId);

            if (!deleted) {
                res.status(404).json({ success: false, error: 'Thought not found' });
                return;
            }

            res.json({
                success: true,
            });
        } catch (error) {
            res.status(400).json({ success: false, error: 'Failed to delete thought' });
        }
    }
};