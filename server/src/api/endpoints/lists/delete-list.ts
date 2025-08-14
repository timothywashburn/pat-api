import { ApiEndpoint } from '../../types';
import ListManager from '../../../controllers/list-manager';
import { ListId } from "@timothyw/pat-common";

export const deleteListEndpoint: ApiEndpoint<undefined, { success: boolean }> = {
    path: '/api/lists/:listId',
    method: 'delete',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const listId = req.params.listId as ListId;

            const deleted = await ListManager.getInstance().delete(listId);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'List not found'
                });
                return;
            }

            res.json({
                success: true
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to delete list'
            });
        }
    }
};