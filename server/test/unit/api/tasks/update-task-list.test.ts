import { TestContext } from '../../../main';
import { TaskListModel } from "../../../../src/models/mongo/task-list-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { UpdateTaskListResponse } from "@timothyw/pat-common";
import { put } from "../../../test-utils";

export async function runUpdateTaskListTest(context: TestContext) {
    if (!context.taskListIds || context.taskListIds.length === 0) {
        throw new Error('No task lists available for update test');
    }

    const taskListId = context.taskListIds[0];

    const updates = {
        name: 'Updated task list name'
    };

    const response = await put<typeof updates, UpdateTaskListResponse>(
        context,
        `/api/tasks/lists/${taskListId}`,
        updates
    );

    if (!response.success) {
        throw new Error('Failed to update task list');
    }

    const updatedTaskList = response.taskList;
    if (updatedTaskList.name !== updates.name) throw new Error('Task list name was not updated correctly');
    const taskListInDb = await TaskListModel.findById(taskListId);
    if (!taskListInDb || taskListInDb.name !== updates.name) throw new Error('Task list not properly updated in database');
}
