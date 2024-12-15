import { ApiEndpoint } from '../../types';
import PersonManager from '../../../controllers/person-manager';

interface GetPeopleResponse {
    people: Array<{
        id: string;
        name: string;
        properties: Array<{
            key: string;
            value: string;
            order: number;
        }>;
        notes: Array<{
            content: string;
            order: number;
            createdAt: string;
            updatedAt: string;
        }>;
    }>;
}

export const getPeopleEndpoint: ApiEndpoint<unknown, GetPeopleResponse> = {
    path: '/api/people',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const people = await PersonManager.getInstance().getAllByUser(req.auth!.userId!);
            res.json({
                success: true,
                data: {
                    people: people.map(p => ({
                        id: p._id.toString(),
                        name: p.name,
                        properties: p.properties,
                        notes: p.notes.map(n => ({
                            ...n,
                            createdAt: n.createdAt.toISOString(),
                            updatedAt: n.updatedAt.toISOString()
                        }))
                    }))
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch people' });
        }
    }
};