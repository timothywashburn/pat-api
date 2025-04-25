import { ApiEndpoint } from '../../types';
import ItemManager from '../../../controllers/item-manager';
import { GetItemsResponse } from "@timothyw/pat-common";

export const getItemsEndpoint: ApiEndpoint<undefined, GetItemsResponse> = {
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