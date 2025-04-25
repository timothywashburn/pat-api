import { ApiEndpoint } from '../../types';
import ThoughtManager from '../../../controllers/thought-manager';
import { GetThoughtsResponse, UserId } from "@timothyw/pat-common";

export const getThoughtsEndpoint: ApiEndpoint<undefined, GetThoughtsResponse> = {
    path: '/api/thoughts',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const thoughts = await ThoughtManager.getInstance().getAllByUser(req.auth!.userId!);
            res.json({
                success: true,
                data: {
                    thoughts: thoughts.map(t => ({
                        id: t._id.toString(),
                        content: t.content
                    }))
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch thoughts' });
        }
    }
};