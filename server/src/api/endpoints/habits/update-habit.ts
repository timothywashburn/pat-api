import { ApiEndpoint } from '../../types';
import HabitManager from '../../../controllers/habit-manager';
import { z } from 'zod';
import {
    Habit,
    HabitId, Serializer,
    UpdateHabitRequest,
    updateHabitRequestSchema,
    UpdateHabitResponse
} from "@timothyw/pat-common";
import { HabitFrequency } from "@timothyw/pat-common/src/types/models";

export const updateHabitEndpoint: ApiEndpoint<UpdateHabitRequest, UpdateHabitResponse> = {
    path: '/api/habits/:habitId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = updateHabitRequestSchema.parse(req.body);
            const habitId = req.params.habitId as HabitId;

            if (!habitId) {
                res.status(400).json({
                    success: false,
                    error: 'Habit ID is required'
                });
                return;
            }

            const updatedHabit = await HabitManager.getInstance().update(req.auth!, habitId, data);

            if (!updatedHabit) {
                res.status(404).json({
                    success: false,
                    error: 'Habit not found'
                });
                return;
            }

            const habitWithEntries = await HabitManager.getInstance().getByIdWithEntries(habitId);

            if (!habitWithEntries) {
                throw new Error('Failed to retrieve updated habit');
            }

            res.json({
                success: true,
                habit: Serializer.serializeHabit(habitWithEntries)
            });
        } catch (error) {
            let message = 'Failed to update habit';

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