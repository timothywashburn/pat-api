import { ApiEndpoint } from '../../types';
import PersonManager from '../../../controllers/person-manager';

interface GetPeopleResponse {
    people: Array<{
        id: string;
        name: string;
        properties: Array<{
            key: string;
            value: string;
        }>;
        notes: Array<{
            content: string;
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
            let data = {
                people: people.map(p => ({
                    id: p._id.toString(),
                    name: p.name,
                    properties: p.properties,
                    notes: p.notes.map(n => ({
                        content: n.content,
                        createdAt: n.createdAt.toISOString(),
                        updatedAt: n.updatedAt.toISOString()
                    }))
                }))
            }
            console.log(data.people[0].notes[0].content);
            res.json({
                success: true,
                data: data
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch people' });
        }
    }
};