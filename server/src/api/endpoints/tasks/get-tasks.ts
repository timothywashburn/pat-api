import { ApiEndpoint } from '../../types';
import TaskManager from '../../../controllers/task-manager';
import { GetTasksResponse, Serializer } from "@timothyw/pat-common";

export const getTasksEndpoint: ApiEndpoint<undefined, GetTasksResponse> = {
    path: '/api/tasks',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const tasks = await TaskManager.getInstance().getAllByUser(req.auth!.userId!);

            res.json({
                success: true,
                tasks: tasks.map(task => Serializer.serializeTaskData(task))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch tasks'
            });
        }
    }
};