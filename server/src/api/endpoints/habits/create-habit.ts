import { ApiEndpoint } from '../../types';
import HabitManager from '../../../controllers/habit-manager';
import { z } from 'zod';
import { CreateHabitRequest, createHabitRequestSchema, CreateHabitResponse, Serializer } from "@timothyw/pat-common";

export const createHabitEndpoint: ApiEndpoint<CreateHabitRequest, CreateHabitResponse> = {
    path: '/api/habits',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = createHabitRequestSchema.parse(req.body);
            const userId = req.auth!.userId!;

            const habit = await HabitManager.getInstance().create(userId, data);
            const habitWithEntries = await HabitManager.getInstance().getByIdWithEntries(habit._id.toString());

            if (!habitWithEntries) {
                throw new Error('Failed to retrieve created habit');
            }

            res.json({
                success: true,
                data: {
                    habit: Serializer.serializeHabit(habitWithEntries)
                }
            });
        } catch (error) {
            let message = 'Failed to create habit';

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