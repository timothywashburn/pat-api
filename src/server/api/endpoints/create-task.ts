import { ApiEndpoint } from '../types';
import TaskManager from '../../controllers/task-manager';
import { Types } from 'mongoose';
import { z } from 'zod';
import {shouldUseGlobalFetchAndWebSocket} from "discord.js";

const createTaskSchema = z.object({
    name: z.string().min(1),
    dueDate: z.string().optional(),
    notes: z.string().optional()
});

type CreateTaskRequest = z.infer<typeof createTaskSchema>;

interface CreateTaskResponse {
    task: {
        id: string;
        name: string;
        dueDate?: string;
        notes?: string;
        completed: boolean;
    };
}

export const createTaskEndpoint: ApiEndpoint<CreateTaskRequest, CreateTaskResponse> = {
    path: '/api/tasks',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = createTaskSchema.parse(req.body);
            const userId = new Types.ObjectId(req.auth!.userId);

            const task = await TaskManager.getInstance().create(userId, {
                name: data.name,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                notes: data.notes
            });

            res.json({
                success: true,
                data: {
                    task: {
                        id: task._id.toString(),
                        name: task.name,
                        dueDate: task.dueDate?.toISOString(),
                        notes: task.notes,
                        completed: task.completed
                    }
                }
            });
        } catch (error) {
            let message = 'Failed to create task';

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