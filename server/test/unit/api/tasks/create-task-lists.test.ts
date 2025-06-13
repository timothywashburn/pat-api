import axios from 'axios';
import { TestContext } from '../../../main';
import { TaskListModel } from "../../../../src/models/mongo/task-list-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { CreateTaskListResponse, TaskListId } from "@timothyw/pat-common";

export async function runCreateTaskListsTest(context: TestContext) {
    const taskList1Response = await axios.post<ApiResponseBody<CreateTaskListResponse>>(
        `${context.baseUrl}/api/tasks/lists`,
        {
            name: 'First test task list'
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!taskList1Response.data.success) throw new Error('failed to create first task list');

    const taskList2Response = await axios.post<ApiResponseBody<CreateTaskListResponse>>(
        `${context.baseUrl}/api/tasks/lists`,
        {
            name: 'Second test task list'
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!taskList2Response.data.success) throw new Error('failed to create second task list');

    context.taskListIds = [
        taskList1Response.data.data!.taskList.id as TaskListId,
        taskList2Response.data.data!.taskList.id as TaskListId
    ];

    const taskLists = await TaskListModel.find({
        userId: context.userId
    });

    if (taskLists.length !== 2) {
        throw new Error(`expected 2 task lists, found ${taskLists.length}`);
    }
}