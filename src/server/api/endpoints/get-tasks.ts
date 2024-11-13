import { ApiEndpoint, ApiResponse, AuthenticatedRequest } from '../types';
import { createAuthMiddleware } from '../middleware/auth-middleware';
import TaskManager from '../../controllers/task-manager';

export const getTasksEndpoint: ApiEndpoint = {
    path: '/api/tasks',
    method: 'get',
    handler: createAuthMiddleware(async (req: AuthenticatedRequest, res: ApiResponse): Promise<void> => {
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
    })
};