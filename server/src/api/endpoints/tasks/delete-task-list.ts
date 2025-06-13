import { ApiEndpoint } from '../../types';
import TaskListManager from '../../../controllers/task-list-manager';
import { TaskListId } from "@timothyw/pat-common";

export const deleteTaskListEndpoint: ApiEndpoint<undefined, { success: boolean }> = {
    path: '/api/tasks/lists/:taskListId',
    method: 'delete',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const taskListId = req.params.taskListId as TaskListId;

            const deleted = await TaskListManager.getInstance().delete(taskListId);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Task list not found'
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
                error: 'Failed to delete task list'
            });
        }
    }
};