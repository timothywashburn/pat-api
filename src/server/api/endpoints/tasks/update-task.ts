import { ApiEndpoint } from '../../types';
import TaskManager from '../../../controllers/task-manager';
import { Types } from 'mongoose';
import { z } from 'zod';

const updateTaskSchema = z.object({
    name: z.string().min(1).optional(),
    dueDate: z.string().nullish(),
    notes: z.string().optional(),
    urgent: z.boolean().optional(),
    category: z.string().nullish(),
    type: z.string().nullish()
});

type UpdateTaskRequest = z.infer<typeof updateTaskSchema>;

interface UpdateTaskResponse {
    task: {
        id: string;
        name: string;
        dueDate?: string;
        notes?: string;
        completed: boolean;
        urgent: boolean;
        category?: string;
        type?: string;
    };
}

export const updateTaskEndpoint: ApiEndpoint<UpdateTaskRequest, UpdateTaskResponse> = {
    path: '/api/tasks/:taskId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = updateTaskSchema.parse(req.body);
            const taskId = new Types.ObjectId(req.params.taskId);

            const task = await TaskManager.getInstance().update(taskId, {
                name: data.name,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                notes: data.notes,
                urgent: data.urgent,
                category: data.category ?? null,
                type: data.type ?? null
            });

            if (!task) {
                res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    task: {
                        id: task._id.toString(),
                        name: task.name,
                        dueDate: task.dueDate?.toISOString(),
                        notes: task.notes,
                        completed: task.completed,
                        urgent: task.urgent,
                        category: task.category ?? undefined,
                        type: task.type ?? undefined
                    }
                }
            });
        } catch (error) {
            let message = 'Failed to update task';

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