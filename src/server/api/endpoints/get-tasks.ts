import { ApiEndpointConfig, ApiResponse, AuthenticatedRequest } from '../types';
import TaskManager from '../../controllers/task-manager';

export const getTasksEndpoint: ApiEndpointConfig<any, true> = {
    path: '/api/tasks',
    method: 'get',
    requiresAuth: true,
    handler: async (req: AuthenticatedRequest, res: ApiResponse): Promise<void> => {
        try {
            const tasks = await TaskManager.getInstance().getAllByUser(req.userId);

            res.json({
                success: true,
                data: tasks
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch tasks'
            });
        }
    }
};