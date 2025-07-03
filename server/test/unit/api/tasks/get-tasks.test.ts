import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetTasksResponse, Serializer } from "@timothyw/pat-common";

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

    const tasks = response.data.data!.tasks.map(t => Serializer.deserializeTaskData(t));

    if (context.taskIds && tasks.length !== context.taskIds.length) {
        const count = context.taskIds.length;
        throw new Error(`Expected ${count} task${count == 1 ? '' : 's'}, got ${tasks.length}`);
    }

    tasks.forEach(task => {
        if (!task._id || !task.name || !task.taskListId) {
            throw new Error('Task missing required properties');
        }
        if (typeof task.completed !== 'boolean') {
            throw new Error('Task completed property should be boolean');
        }
    });
}
