import { ApiEndpoint } from '../../types';
import ItemManager from '../../../controllers/item-manager';
import { GetItemsResponse, ItemId, Serializer } from "@timothyw/pat-common";

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
                    items: items.map(item => Serializer.serializeItemData(item))
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