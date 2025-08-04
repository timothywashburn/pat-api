import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetTaskListsResponse, Serializer } from "@timothyw/pat-common";
import { get } from "../../../test-utils";

export async function runGetTaskListsTest(context: TestContext) {
    const response = await get<{}, GetTaskListsResponse>(
        context,
        "/api/tasks/lists"
    );

    if (!response.success) {
        throw new Error('Failed to get task lists');
    }

    const taskLists = response.taskLists.map(tl => Serializer.deserializeTaskListData(tl));

    if (context.taskListIds && taskLists.length !== context.taskListIds.length) {
        const count = context.taskListIds.length;
        throw new Error(`Expected ${count} task list${count == 1 ? '' : 's'}, got ${taskLists.length}`);
    }

    taskLists.forEach(taskList => {
        if (!taskList._id || !taskList.name) {
            throw new Error('Task list missing required properties');
        }
    });
}
