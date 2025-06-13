import { ApiEndpoint } from '../../types';
import TaskManager from '../../../controllers/task-manager';
import { TaskId } from "@timothyw/pat-common";

export const deleteTaskEndpoint: ApiEndpoint<undefined, { success: boolean }> = {
    path: '/api/tasks/:taskId',
    method: 'delete',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const taskId = req.params.taskId as TaskId;

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
                data: { success: true }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to delete task'
            });
        }
    }
};