import axios from 'axios';
import { TestContext } from '../../../main';
import { TaskModel } from "../../../../src/models/mongo/task-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { CreateTaskResponse, TaskId, Serializer } from "@timothyw/pat-common";

export async function runCreateTasksTest(context: TestContext) {
    if (!context.taskListIds || context.taskListIds.length === 0) {
        throw new Error('No task lists available for creating tasks');
    }

    await createTask(context, {
        name: 'Task 1 (to update later)',
        notes: 'This notes text should get changed',
        taskListId: context.taskListIds[0]
    });

    await createTask(context, {
        name: 'Task 2',
        notes: 'Second task for testing',
        taskListId: context.taskListIds[0]
    });

    await createTask(context, {
        name: 'Task to delete',
        notes: 'This task will be deleted',
        taskListId: context.taskListIds[0]
    });

    const tasks = await TaskModel.find({
        userId: context.userId
    });

    if (tasks.length !== context.taskIds.length)
        throw new Error(`expected ${context.taskIds.length} task${context.taskIds.length === 1 ? "" : "s"}, found ${tasks.length}`);
}

async function createTask(context: TestContext, data: Record<string, any>) {
    const response = await axios.post<ApiResponseBody<CreateTaskResponse>>(
        `${context.baseUrl}/api/tasks`,
        { ...data },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error(`failed to create task: ${data.name}`);
    const task = Serializer.deserializeTaskData(response.data.data!.task);
    context.taskIds.push(task._id);
}
