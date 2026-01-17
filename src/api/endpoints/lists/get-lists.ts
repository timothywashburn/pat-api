import { ApiEndpoint } from '../../types';
import ListManager from '../../../controllers/list-manager';
import { GetListsResponse, Serializer } from "@timothyw/pat-common";

export const getListsEndpoint: ApiEndpoint<undefined, GetListsResponse> = {
    path: '/api/lists',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const lists = await ListManager.getInstance().getAllByUser(req.patAuth!.userId!);

            res.json({
                success: true,
                lists: lists.map(list => Serializer.serialize(list))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch lists'
            });
        }
    }
};