import { ApiEndpoint } from '../types';
import TaskManager from '../../controllers/task-manager';
import { Types } from 'mongoose';
import { TaskData } from '../../models/task';

interface GetTasksRequestRequest {
    userId: string;
}

interface GetTasksResponse {
    tasks: TaskData[];
}

export const getTasksEndpoint: ApiEndpoint<GetTasksRequestRequest, GetTasksResponse> = {
    path: '/api/tasks',
    method: 'get',
    requiresAuth: true,
    handler: async (req, res) => {
        const userId = new Types.ObjectId(req.body.userId);

        try {
            const tasks = await TaskManager.getInstance().getAllByUser(userId);

            res.json({
                success: true,
                data: {
                    tasks
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch tasks'
            });
        }
    }
};