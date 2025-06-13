import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetTasksResponse } from "../../../../src/temp/task-types";

export async function runGetTasksTest(context: TestContext) {
    const response = await axios.get<ApiResponseBody<GetTasksResponse>>(
        `${context.baseUrl}/api/tasks`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) {
        throw new Error('Failed to get tasks');
    }

    const tasks = response.data.data!.tasks;

    if (tasks.length !== 2) {
        throw new Error(`Expected 2 tasks, got ${tasks.length}`);
    }

    // Verify task properties
    tasks.forEach(task => {
        if (!task.id || !task.name || !task.taskListId) {
            throw new Error('Task missing required properties');
        }
        if (typeof task.completed !== 'boolean') {
            throw new Error('Task completed property should be boolean');
        }
    });
}