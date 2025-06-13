import axios from 'axios';
import { TestContext } from '../../../main';
import { TaskModel } from "../../../../src/models/mongo/task-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { CompleteTaskResponse } from "@timothyw/pat-common";

export async function runCompleteTaskTest(context: TestContext) {
    if (!context.taskIds || context.taskIds.length === 0) {
        throw new Error('No tasks available for completion test');
    }

    const taskId = context.taskIds[0];

    // Complete the task
    const response = await axios.put<ApiResponseBody<CompleteTaskResponse>>(
        `${context.baseUrl}/api/tasks/${taskId}/complete`,
        {
            completed: true
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) {
        throw new Error('Failed to complete task');
    }

    const completedTask = response.data.data!.task;

    if (!completedTask.completed) {
        throw new Error('Task should be marked as completed');
    }

    // Verify in database
    const taskInDb = await TaskModel.findById(taskId);
    if (!taskInDb || !taskInDb.completed) {
        throw new Error('Task not properly marked as completed in database');
    }

    // Test uncompleting the task
    const uncompleteResponse = await axios.put<ApiResponseBody<CompleteTaskResponse>>(
        `${context.baseUrl}/api/tasks/${taskId}/complete`,
        {
            completed: false
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!uncompleteResponse.data.success) {
        throw new Error('Failed to uncomplete task');
    }

    const uncompletedTask = uncompleteResponse.data.data!.task;

    if (uncompletedTask.completed) {
        throw new Error('Task should be marked as not completed');
    }
}