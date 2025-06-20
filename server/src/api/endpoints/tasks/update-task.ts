import { ApiEndpoint } from '../../types';
import TaskManager from '../../../controllers/task-manager';
import { z } from 'zod';
import { UpdateTaskRequest, UpdateTaskResponse, TaskId, updateTaskRequestSchema } from "@timothyw/pat-common";

export const updateTaskEndpoint: ApiEndpoint<UpdateTaskRequest, UpdateTaskResponse> = {
    path: '/api/tasks/:taskId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const taskId = req.params.taskId as TaskId;
            const data = updateTaskRequestSchema.parse(req.body);

            const task = await TaskManager.getInstance().update(req.auth!, taskId, data);

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
                        id: task._id,
                        name: task.name,
                        notes: task.notes ?? undefined,
                        completed: task.completed,
                        taskListId: task.taskListId,
                        createdAt: task.createdAt.toISOString(),
                        updatedAt: task.updatedAt.toISOString()
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