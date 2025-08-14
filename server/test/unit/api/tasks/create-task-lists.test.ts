import { TestContext } from '../../../main';
import { TaskListModel } from "../../../../src/models/mongo/task-list-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { CreateTaskListResponse, TaskListId, Serializer, TaskListType } from "@timothyw/pat-common";
import { post } from "../../../test-utils";

export async function runCreateTaskListsTest(context: TestContext) {
    await createTaskList(context, { name: 'Task List 1 (to update later)', type: TaskListType.TASKS });
    await createTaskList(context, { name: 'Task List 2', type: TaskListType.NOTES });
    await createTaskList(context, { name: 'Task List to delete', type: TaskListType.TASKS });

    const taskLists = await TaskListModel.find({
        userId: context.userId
    });

    if (taskLists.length !== context.taskListIds.length)
        throw new Error(`expected ${context.taskListIds.length} task list${context.taskListIds.length === 1 ? "" : "s"}, found ${taskLists.length}`);
}

async function createTaskList(context: TestContext, data: Record<string, any>) {
    const response = await post<Record<string, any>, CreateTaskListResponse>(
        context,
        "/api/tasks/lists",
        { ...data }
    );

    if (!response.success) throw new Error(`failed to create task list: ${data.name}`);
    const taskList = Serializer.deserializeTaskListData(response.taskList);
    context.taskListIds.push(taskList._id);
}
