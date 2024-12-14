import { ApiEndpoint } from '../../types';
import ThoughtManager from '../../../controllers/thought-manager';

interface GetThoughtsResponse {
    thoughts: Array<{
        id: string;
        content: string;
    }>;
}

export const getThoughtsEndpoint: ApiEndpoint<unknown, GetThoughtsResponse> = {
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