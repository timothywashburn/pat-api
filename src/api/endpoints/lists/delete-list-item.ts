import { ApiEndpoint } from '../../types';
import ListItemManager from '../../../controllers/list-item-manager';
import { ListItemId } from "@timothyw/pat-common";

export const deleteListItemEndpoint: ApiEndpoint<undefined, { success: boolean }> = {
    path: '/api/list-items/:listItemId',
    method: 'delete',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const listItemId = req.params.listItemId as ListItemId;

            const deleted = await ListItemManager.getInstance().delete(listItemId);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'List item not found'
                });
                return;
            }

            res.json({
                success: true
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to delete list item'
            });
        }
    }
};