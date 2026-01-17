import { ApiEndpoint } from '../../types';
import HabitManager from '../../../controllers/habit-manager';
import HabitEntryManager from '../../../controllers/habit-entry-manager';
import { DateOnlyString, DeleteHabitEntryResponse, Serializer } from "@timothyw/pat-common";

export const deleteHabitEntryEndpoint: ApiEndpoint<undefined, DeleteHabitEntryResponse> = {
    path: '/api/habits/:habitId/entries/:dateString',
    method: 'delete',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const userId = req.patAuth!.userId!;
            const habitId = req.params.habitId;
            const dateOnlyString = req.params.dateString as DateOnlyString;

            if (!habitId) {
                res.status(400).json({
                    success: false,
                    error: 'Habit ID is required'
                });
                return;
            }

            if (!dateOnlyString) {
                res.status(400).json({
                    success: false,
                    error: 'Date is required'
                });
                return;
            }

            // Verify the habit exists and belongs to the user
            const habit = await HabitManager.getInstance().getById(habitId);
            if (!habit || habit.userId !== userId) {
                res.status(404).json({
                    success: false,
                    error: 'Habit not found'
                });
                return;
            }

            // Delete the entry
            await HabitEntryManager.getInstance().deleteByDate(habitId, dateOnlyString);

            // Return the updated habit with entries and stats
            const habitWithEntries = await HabitManager.getInstance().getByIdWithEntries(habitId);

            if (!habitWithEntries) {
                throw new Error('Failed to retrieve updated habit');
            }

            res.json({
                success: true,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to delete habit entry'
            });
        }
    }
};