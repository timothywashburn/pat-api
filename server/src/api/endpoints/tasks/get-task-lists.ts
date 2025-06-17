import { ApiEndpoint } from '../../types';
import TaskListManager from '../../../controllers/task-list-manager';
import { GetTaskListsResponse } from "@timothyw/pat-common";

export const getTaskListsEndpoint: ApiEndpoint<undefined, GetTaskListsResponse> = {
    path: '/api/tasks/lists',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const taskLists = await TaskListManager.getInstance().getAllByUser(req.auth!.userId!);

            res.json({
                success: true,
                data: {
                    taskLists: taskLists.map(taskList => ({
                        id: taskList._id,
                        name: taskList.name,
                        createdAt: taskList.createdAt.toISOString(),
                        updatedAt: taskList.updatedAt.toISOString()
                    }))
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch task lists'
            });
        }
    }
};