import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import { TaskModel } from "../../../../src/models/mongo/task-data";
import { ApiResponseBody } from "../../../../src/api/types";

export async function runDeleteTaskTest(context: TestContext) {
    if (!context.taskIds || context.taskIds.length < 2) {
        throw new Error('Need at least 2 tasks for delete test');
    }

    const deleteId = context.taskIds.pop();

    const response = await axios.delete<ApiResponseBody<{ success: boolean }>>(
        `${context.baseUrl}/api/tasks/${deleteId}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) {
        throw new Error('Failed to delete task');
    }

    const taskInDb = await TaskModel.findById(deleteId);
    if (taskInDb) {
        throw new Error('Task should have been deleted from database');
    }

    for (let i = 0; i < context.taskIds.length; i++) {
        const task = await TaskModel.findOne({
            _id: new Types.ObjectId(context.taskIds[i]),
            userId: context.userId
        });

        if (!task) throw new Error(`Task with id ${context.taskIds[i]} not found`);
    }
}
