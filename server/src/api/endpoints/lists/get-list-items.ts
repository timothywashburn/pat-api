import { ApiEndpoint } from '../../types';
import ListItemManager from '../../../controllers/list-item-manager';
import { GetListItemsResponse, Serializer } from "@timothyw/pat-common";

export const getListItemsEndpoint: ApiEndpoint<undefined, GetListItemsResponse> = {
    path: '/api/list-items',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const listItems = await ListItemManager.getInstance().getAllByUser(req.auth!.userId!);

            res.json({
                success: true,
                listItems: listItems.map(listItem => Serializer.serialize(listItem))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch list items'
            });
        }
    }
};