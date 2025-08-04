import { TestContext } from '../../../main';
import { TaskModel } from "../../../../src/models/mongo/task-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { CompleteTaskResponse } from "@timothyw/pat-common";
import { put } from "../../../test-utils";

export async function runCompleteTaskTest(context: TestContext) {
    if (!context.taskIds || context.taskIds.length === 0) {
        throw new Error('No tasks available for completion test');
    }

    const taskId = context.taskIds[0];

    // Complete the task
    const response = await put<{ completed: boolean }, CompleteTaskResponse>(
        context,
        `/api/tasks/${taskId}/complete`,
        {
            completed: true
        }
    );

    if (!response.success) {
        throw new Error('Failed to complete task');
    }

    const completedTask = response.task;

    if (!completedTask.completed) {
        throw new Error('Task should be marked as completed');
    }

    // Verify in database
    const taskInDb = await TaskModel.findById(taskId).lean();
    if (!taskInDb || !taskInDb.completed) {
        throw new Error('Task not properly marked as completed in database');
    }

    // Test uncompleting the task
    const uncompleteResponse = await put<{ completed: boolean }, CompleteTaskResponse>(
        context,
        `/api/tasks/${taskId}/complete`,
        {
            completed: false
        }
    );

    if (!uncompleteResponse.success) {
        throw new Error('Failed to uncomplete task');
    }

    const uncompletedTask = uncompleteResponse.task;

    if (uncompletedTask.completed) {
        throw new Error('Task should be marked as not completed');
    }
}