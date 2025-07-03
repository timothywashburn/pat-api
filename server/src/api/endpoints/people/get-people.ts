import { ApiEndpoint } from '../../types';
import PersonManager from '../../../controllers/person-manager';
import { GetPeopleResponse, Serializer, UserId } from "@timothyw/pat-common";

export const getPeopleEndpoint: ApiEndpoint<undefined, GetPeopleResponse> = {
    path: '/api/people',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const people = await PersonManager.getInstance().getAllByUser(req.auth!.userId!);
            res.json({
                success: true,
                data: {
                    people: people.map(person => Serializer.serializePerson(person))
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch people' });
        }
    }
};