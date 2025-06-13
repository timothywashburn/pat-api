import axios from 'axios';
import { TestContext } from '../../../main';
import { TaskModel } from "../../../../src/models/mongo/task-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { UpdateTaskResponse } from "@timothyw/pat-common";

export async function runUpdateTaskTest(context: TestContext) {
    if (!context.taskIds || context.taskIds.length === 0) {
        throw new Error('No tasks available for update test');
    }

    const taskId = context.taskIds[0];

    const response = await axios.put<ApiResponseBody<UpdateTaskResponse>>(
        `${context.baseUrl}/api/tasks/${taskId}`,
        {
            name: 'Updated task name',
            notes: 'Updated task notes'
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) {
        throw new Error('Failed to update task');
    }

    const updatedTask = response.data.data!.task;

    if (updatedTask.name !== 'Updated task name') {
        throw new Error('Task name was not updated correctly');
    }

    if (updatedTask.notes !== 'Updated task notes') {
        throw new Error('Task notes were not updated correctly');
    }

    // Verify in database
    const taskInDb = await TaskModel.findById(taskId);
    if (!taskInDb || taskInDb.name !== 'Updated task name') {
        throw new Error('Task not properly updated in database');
    }
}