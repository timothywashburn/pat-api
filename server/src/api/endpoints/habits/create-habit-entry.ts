import { ApiEndpoint } from '../../types';
import HabitManager from '../../../controllers/habit-manager';
import HabitEntryManager from '../../../controllers/habit-entry-manager';
import { z } from 'zod';
import { CreateHabitEntryRequest, createHabitEntryRequestSchema, CreateHabitEntryResponse } from "@timothyw/pat-common";

export const createHabitEntryEndpoint: ApiEndpoint<CreateHabitEntryRequest, CreateHabitEntryResponse> = {
    path: '/api/habits/:habitId/entries',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = createHabitEntryRequestSchema.parse(req.body);
            const userId = req.auth!.userId!;
            const habitId = req.params.habitId;

            if (!habitId) {
                res.status(400).json({
                    success: false,
                    error: 'Habit ID is required'
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

            // Validate date is not before habit creation and not in the future
            const entryDate = new Date(data.date);
            const habitCreated = new Date(habit.createdAt);
            const today = new Date();
            
            // Set time to start of day for comparison
            entryDate.setHours(0, 0, 0, 0);
            habitCreated.setHours(0, 0, 0, 0);
            today.setHours(23, 59, 59, 999);

            // if (entryDate < habitCreated) {
            //     res.status(400).json({
            //         success: false,
            //         error: 'Cannot create entry before habit was created'
            //     });
            //     return;
            // }

            if (entryDate > today) {
                res.status(400).json({
                    success: false,
                    error: 'Cannot create entry for future dates'
                });
                return;
            }

            // Create or update the entry
            await HabitEntryManager.getInstance().createOrUpdate(habitId, data.date, data.status);

            // Return the updated habit with entries and stats
            const habitWithEntries = await HabitManager.getInstance().getByIdWithEntries(habitId);

            if (!habitWithEntries) {
                throw new Error('Failed to retrieve updated habit');
            }

            res.json({
                success: true,
                data: {
                    habit: habitWithEntries
                }
            });
        } catch (error) {
            let message = 'Failed to create habit entry';

            if (error instanceof z.ZodError) {
                message = error.errors[0].message;
            }

            res.status(400).json({
                success: false,
                error: message
            });
        }
    }
};