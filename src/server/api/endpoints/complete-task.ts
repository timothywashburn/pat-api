import { ApiEndpoint } from '../types';
import TaskManager from '../../controllers/task-manager';
import { Types } from 'mongoose';
import { z } from 'zod';

const completeTaskSchema = z.object({
    completed: z.boolean()
});

type CompleteTaskRequest = z.infer<typeof completeTaskSchema>;

interface CompleteTaskResponse {
    task: {
        id: string;
        name: string;
        completed: boolean;
        dueDate?: string;
        notes?: string;
    };
}

export const completeTaskEndpoint: ApiEndpoint<CompleteTaskRequest, CompleteTaskResponse> = {
    path: '/api/tasks/:taskId/complete',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = completeTaskSchema.parse(req.body);
            const taskId = new Types.ObjectId(req.params.taskId);

            const task = await TaskManager.getInstance().setCompleted(taskId, data.completed);

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
                        completed: task.completed,
                        dueDate: task.dueDate?.toISOString(),
                        notes: task.notes
                    }
                }
            });
        } catch (error) {
            let message = 'Failed to update task completion status';

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