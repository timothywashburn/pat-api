import { ApiEndpoint } from '../../types';
import ItemManager from '../../../controllers/item-manager';
import { ItemData } from '../../../models/mongo/item-data';

interface GetItemsResponse {
    items: ItemData[];
}

export const getItemsEndpoint: ApiEndpoint<unknown, GetItemsResponse> = {
    path: '/api/items',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const items = await ItemManager.getInstance().getAllByUser(req.auth!.userId!);

            res.json({
                success: true,
                data: {
                    items: items
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch items'
            });
        }
    }
};