import axios from 'axios';
import { TestContext } from '../../../main';
import { TaskListModel } from "../../../../src/models/mongo/task-list-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { CreateTaskListResponse, TaskListId } from "@timothyw/pat-common";

export async function runCreateTaskListsTest(context: TestContext) {
    await createTaskList(context, { name: 'Task List 1 (to update later)' });
    await createTaskList(context, { name: 'Task List 2' });
    await createTaskList(context, { name: 'Task List to delete' });

    const taskLists = await TaskListModel.find({
        userId: context.userId
    });

    if (taskLists.length !== context.taskListIds.length)
        throw new Error(`expected ${context.taskListIds.length} task list${context.taskListIds.length === 1 ? "" : "s"}, found ${taskLists.length}`);
}

async function createTaskList(context: TestContext, data: Record<string, any>) {
    const response = await axios.post<ApiResponseBody<CreateTaskListResponse>>(
        `${context.baseUrl}/api/tasks/lists`,
        { ...data },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error(`failed to create task list: ${data.name}`);
    context.taskListIds.push(response.data.data!.taskList.id as TaskListId);
}
