import { ApiEndpoint } from '../../types';
import TaskListManager from '../../../controllers/task-list-manager';
import { z } from 'zod';
import {
    UpdateTaskListRequest,
    UpdateTaskListResponse,
    TaskListId,
    updateTaskListRequestSchema, Serializer
} from "@timothyw/pat-common";

export const updateTaskListEndpoint: ApiEndpoint<UpdateTaskListRequest, UpdateTaskListResponse> = {
    path: '/api/tasks/lists/:taskListId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const taskListId = req.params.taskListId as TaskListId;
            const data = updateTaskListRequestSchema.parse(req.body);

            const taskList = await TaskListManager.getInstance().update(req.auth!, taskListId, data);

            if (!taskList) {
                res.status(404).json({
                    success: false,
                    error: 'Task list not found'
                });
                return;
            }

            res.json({
                success: true,
                taskList: Serializer.serializeTaskListData(taskList)
            });
        } catch (error) {
            let message = 'Failed to update task list';

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