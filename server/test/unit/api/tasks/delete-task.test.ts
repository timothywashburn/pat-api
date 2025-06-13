import axios from 'axios';
import { TestContext } from '../../../main';
import { TaskModel } from "../../../../src/models/mongo/task-data";
import { ApiResponseBody } from "../../../../src/api/types";

export async function runDeleteTaskTest(context: TestContext) {
    if (!context.taskIds || context.taskIds.length < 2) {
        throw new Error('Need at least 2 tasks for delete test');
    }

    const taskId = context.taskIds[1]; // Delete the second task

    const response = await axios.delete<ApiResponseBody<{ success: boolean }>>(
        `${context.baseUrl}/api/tasks/${taskId}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) {
        throw new Error('Failed to delete task');
    }

    // Verify task is deleted from database
    const taskInDb = await TaskModel.findById(taskId);
    if (taskInDb) {
        throw new Error('Task should have been deleted from database');
    }

    // Remove from context
    context.taskIds = context.taskIds.filter(id => id !== taskId);

    // Verify remaining tasks still exist
    const remainingTasks = await TaskModel.find({
        userId: context.userId
    });

    if (remainingTasks.length !== 1) {
        throw new Error(`Expected 1 remaining task, found ${remainingTasks.length}`);
    }
}