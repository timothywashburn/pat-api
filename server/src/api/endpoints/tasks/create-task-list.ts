import { ApiEndpoint } from '../../types';
import TaskListManager from '../../../controllers/task-list-manager';
import { z } from 'zod';
import { CreateTaskListRequest, createTaskListRequestSchema, CreateTaskListResponse } from "@timothyw/pat-common";

export const createTaskListEndpoint: ApiEndpoint<CreateTaskListRequest, CreateTaskListResponse> = {
    path: '/api/tasks/lists',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = createTaskListRequestSchema.parse(req.body);
            const userId = req.auth!.userId!;

            const taskList = await TaskListManager.getInstance().create(userId, {
                name: data.name
            });

            res.json({
                success: true,
                data: {
                    taskList: {
                        id: taskList._id.toString(),
                        name: taskList.name,
                        createdAt: taskList.createdAt.toISOString(),
                        updatedAt: taskList.updatedAt.toISOString()
                    }
                }
            });
        } catch (error) {
            let message = 'Failed to create task list';

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