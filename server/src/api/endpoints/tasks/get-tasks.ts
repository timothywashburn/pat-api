import { ApiEndpoint } from '../../types';
import TaskManager from '../../../controllers/task-manager';
import { GetTasksResponse } from "@timothyw/pat-common";

export const getTasksEndpoint: ApiEndpoint<undefined, GetTasksResponse> = {
    path: '/api/tasks',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const tasks = await TaskManager.getInstance().getAllByUser(req.auth!.userId!);

            res.json({
                success: true,
                data: {
                    tasks: tasks.map(task => ({
                        id: task._id.toString(),
                        name: task.name,
                        notes: task.notes,
                        completed: task.completed,
                        taskListId: task.taskListId,
                        createdAt: task.createdAt.toISOString(),
                        updatedAt: task.updatedAt.toISOString()
                    }))
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