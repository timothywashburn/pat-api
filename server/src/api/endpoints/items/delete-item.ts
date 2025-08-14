import { ApiEndpoint } from '../../types';
import ItemManager from '../../../controllers/item-manager';
import { DeleteItemResponse, ItemId } from "@timothyw/pat-common";

export const deleteItemEndpoint: ApiEndpoint<undefined, DeleteItemResponse> = {
    path: '/api/items/:itemId',
    method: 'delete',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const itemId = req.params.itemId as ItemId;
            const deleted = await ItemManager.getInstance().delete(itemId);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Item not found'
                });
                return;
            }

            res.json({
                success: true,
                deleted: true
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: 'Failed to delete item'
            });
        }
    }
};