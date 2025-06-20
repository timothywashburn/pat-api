import { ApiEndpoint } from '../../types';
import PersonManager from '../../../controllers/person-manager';
import { GetPeopleResponse, UserId } from "@timothyw/pat-common";

export const getPeopleEndpoint: ApiEndpoint<undefined, GetPeopleResponse> = {
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
                    notes: p.notes
                }))
            }
            res.json({
                success: true,
                data: data
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch people' });
        }
    }
};