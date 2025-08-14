import { ApiEndpoint } from '../../types';
import HabitManager from '../../../controllers/habit-manager';
import { DeleteHabitResponse } from "@timothyw/pat-common";

export const deleteHabitEndpoint: ApiEndpoint<undefined, DeleteHabitResponse> = {
    path: '/api/habits/:habitId',
    method: 'delete',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const userId = req.auth!.userId!;
            const habitId = req.params.habitId;

            if (!habitId) {
                res.status(400).json({
                    success: false,
                    error: 'Habit ID is required'
                });
                return;
            }

            const deleted = await HabitManager.getInstance().delete(habitId, userId);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Habit not found'
                });
                return;
            }

            res.json({
                success: true,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to delete habit'
            });
        }
    }
};