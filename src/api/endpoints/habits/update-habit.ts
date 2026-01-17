import { ApiEndpoint } from '../../types';
import HabitManager from '../../../controllers/habit-manager';
import { z } from 'zod';
import {
    HabitId, NotificationEntityType, Serializer,
    UpdateHabitRequest,
    updateHabitRequestSchema,
    UpdateHabitResponse
} from "@timothyw/pat-common";
import NotificationTemplateManager from "../../../controllers/notification-template-manager";

export const updateHabitEndpoint: ApiEndpoint<UpdateHabitRequest, UpdateHabitResponse> = {
    path: '/api/habits/:habitId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = updateHabitRequestSchema.parse(req.body);
            const userId = req.patAuth!.userId!;
            const habitId = req.params.habitId as HabitId;

            if (!habitId) {
                res.status(400).json({
                    success: false,
                    error: 'Habit ID is required'
                });
                return;
            }

            const updatedHabit = await HabitManager.getInstance().update(req.patAuth!.userId, habitId, data);

            if (!updatedHabit) {
                res.status(404).json({
                    success: false,
                    error: 'Habit not found'
                });
                return;
            }

            const habitWithEntries = await HabitManager.getInstance().getByIdWithEntries(habitId);
            if (!habitWithEntries) throw new Error('Failed to retrieve updated habit');

            await NotificationTemplateManager.removeAllForEntity(userId, NotificationEntityType.AGENDA_ITEM, habitId);
            await NotificationTemplateManager.onNewEntity(userId, NotificationEntityType.HABIT, habitWithEntries._id, habitWithEntries);

            res.json({
                success: true,
                habit: Serializer.serialize(habitWithEntries)
            });
        } catch (error) {
            let message = 'Failed to update habit';

            if (error instanceof z.ZodError) {
                message = error.issues[0].message;
            }

            res.status(400).json({
                success: false,
                error: message
            });
        }
    }
};