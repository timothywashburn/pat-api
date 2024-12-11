import { ApiEndpoint } from '../../types';
import ItemManager from '../../../controllers/item-manager';
import { Types } from 'mongoose';

interface DeleteItemResponse {
    deleted: boolean;
}

export const deleteItemEndpoint: ApiEndpoint<unknown, DeleteItemResponse> = {
    path: '/api/items/:itemId',
    method: 'delete',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const itemId = new Types.ObjectId(req.params.itemId);
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
                data: {
                    deleted: true
                }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: 'Failed to delete item'
            });
        }
    }
};