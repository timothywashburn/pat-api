import { ApiEndpoint } from '../../types';
import TaskManager from '../../../controllers/task-manager';
import { z } from 'zod';
import {
    CompleteTaskRequest,
    completeTaskRequestSchema,
    CompleteTaskResponse,
    Serializer,
    TaskId
} from "@timothyw/pat-common";

export const completeTaskEndpoint: ApiEndpoint<CompleteTaskRequest, CompleteTaskResponse> = {
    path: '/api/tasks/:taskId/complete',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const taskId = req.params.taskId as TaskId;
            const data = completeTaskRequestSchema.parse(req.body);

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
                    task: Serializer.serializeTaskData(task)
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