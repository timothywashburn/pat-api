import { ApiEndpoint } from '../types';
import TaskManager from '../../controllers/task-manager';
import { TaskData } from '../../models/task';

interface GetTasksResponse {
    tasks: TaskData[];
}

export const getTasksEndpoint: ApiEndpoint<unknown, GetTasksResponse> = {
    path: '/api/tasks',
    method: 'get',
    requiresAuth: true,
    handler: async (req, res) => {
        try {
            const tasks = await TaskManager.getInstance().getAllByUser(req.auth!.userId!);

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