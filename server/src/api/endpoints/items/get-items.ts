import { ApiEndpoint } from '../../types';
import ItemManager from '../../../controllers/item-manager';
import { GetAgendaItemsResponse, ItemId, Serializer } from "@timothyw/pat-common";

export const getItemsEndpoint: ApiEndpoint<undefined, GetAgendaItemsResponse> = {
    path: '/api/items',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const items = await ItemManager.getInstance().getAllByUser(req.auth!.userId!);

            res.json({
                success: true,
                agendaItems: items.map(item => Serializer.serialize(item))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch items'
            });
        }
    }
};