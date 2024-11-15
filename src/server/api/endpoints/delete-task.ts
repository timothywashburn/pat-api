import { ApiEndpoint } from '../types';
import TaskManager from '../../controllers/task-manager';
import { Types } from 'mongoose';

interface DeleteTaskResponse {
    deleted: boolean;
}

export const deleteTaskEndpoint: ApiEndpoint<unknown, DeleteTaskResponse> = {
    path: '/api/tasks/:taskId',
    method: 'delete',
    requiresAuth: true,
    handler: async (req, res) => {
        try {
            const taskId = new Types.ObjectId(req.params.taskId);
            const deleted = await TaskManager.getInstance().delete(taskId);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    deleted: true
                }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: 'Failed to delete task'
            });
        }
    }
};