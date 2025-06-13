import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetTaskListsResponse } from "@timothyw/pat-common";

export async function runGetTaskListsTest(context: TestContext) {
    const response = await axios.get<ApiResponseBody<GetTaskListsResponse>>(
        `${context.baseUrl}/api/tasks/lists`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) {
        throw new Error('Failed to get task lists');
    }

    const taskLists = response.data.data!.taskLists;

    if (context.taskListIds && taskLists.length !== context.taskListIds.length) {
        const count = context.taskListIds.length;
        throw new Error(`Expected ${count} task list${count == 1 ? '' : 's'}, got ${taskLists.length}`);
    }

    taskLists.forEach(taskList => {
        if (!taskList.id || !taskList.name) {
            throw new Error('Task list missing required properties');
        }
    });
}
