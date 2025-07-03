import { ApiEndpoint } from '../../types';
import HabitManager from '../../../controllers/habit-manager';
import { GetHabitsResponse, Serializer } from "@timothyw/pat-common";

export const getHabitsEndpoint: ApiEndpoint<undefined, GetHabitsResponse> = {
    path: '/api/habits',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const habits = await HabitManager.getInstance().getAllByUserWithEntries(req.auth!.userId!);

            res.json({
                success: true,
                data: {
                    habits: habits.map(habit => Serializer.serializeHabit(habit))
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch habits'
            });
        }
    }
};