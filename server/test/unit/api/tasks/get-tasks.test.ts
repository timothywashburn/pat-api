import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetTasksResponse, Serializer } from "@timothyw/pat-common";
import { get } from "../../../test-utils";

export async function runGetTasksTest(context: TestContext) {
    const response = await get<{}, GetTasksResponse>(
        context,
        "/api/tasks"
    );

    if (!response.success) {
        throw new Error('Failed to get tasks');
    }

    const tasks = response.tasks.map(t => Serializer.deserializeTaskData(t));

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
