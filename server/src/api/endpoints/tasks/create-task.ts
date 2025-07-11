import { ApiEndpoint } from '../../types';
import TaskManager from '../../../controllers/task-manager';
import { z } from 'zod';
import { CreateTaskRequest, createTaskRequestSchema, CreateTaskResponse, Serializer } from "@timothyw/pat-common";

export const createTaskEndpoint: ApiEndpoint<CreateTaskRequest, CreateTaskResponse> = {
    path: '/api/tasks',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = createTaskRequestSchema.parse(req.body);
            const userId = req.auth!.userId!;

            const task = await TaskManager.getInstance().create(userId, {
                name: data.name,
                notes: data.notes,
                taskListId: data.taskListId
            });

            res.json({
                success: true,
                data: {
                    task: Serializer.serializeTaskData(task)
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