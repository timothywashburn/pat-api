import axios from 'axios';
import { TestContext } from '../../../main';
import { TaskModel } from "../../../../src/models/mongo/task-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { CreateTaskResponse, TaskId } from "../../../../src/temp/task-types";

export async function runCreateTasksTest(context: TestContext) {
    // First create a task list for our tasks
    if (!context.taskListIds || context.taskListIds.length === 0) {
        throw new Error('No task lists available for creating tasks');
    }

    const task1Response = await axios.post<ApiResponseBody<CreateTaskResponse>>(
        `${context.baseUrl}/api/tasks`,
        {
            name: 'First test task',
            notes: 'First task for testing',
            taskListId: context.taskListIds[0]
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!task1Response.data.success) throw new Error('failed to create first task');

    const task2Response = await axios.post<ApiResponseBody<CreateTaskResponse>>(
        `${context.baseUrl}/api/tasks`,
        {
            name: 'Second test task', 
            notes: 'Second task for testing',
            taskListId: context.taskListIds[0]
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!task2Response.data.success) throw new Error('failed to create second task');

    context.taskIds = [
        task1Response.data.data!.task.id as TaskId,
        task2Response.data.data!.task.id as TaskId
    ];

    const tasks = await TaskModel.find({
        userId: context.userId
    });

    if (tasks.length !== 2) {
        throw new Error(`expected 2 tasks, found ${tasks.length}`);
    }
}