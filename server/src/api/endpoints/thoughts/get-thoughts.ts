import { ApiEndpoint } from '../../types';
import ThoughtManager from '../../../controllers/thought-manager';
import { GetThoughtsResponse, Serializer, UserId } from "@timothyw/pat-common";

export const getThoughtsEndpoint: ApiEndpoint<undefined, GetThoughtsResponse> = {
    path: '/api/thoughts',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const thoughts = await ThoughtManager.getInstance().getAllByUser(req.patAuth!.userId!);
            res.json({
                success: true,
                thoughts: thoughts.map(thought => Serializer.serialize(thought))
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch thoughts' });
        }
    }
};