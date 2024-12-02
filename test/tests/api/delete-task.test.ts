import axios from 'axios';
import { TestContext } from '../../main';
import { Types } from 'mongoose';
import {TaskModel} from "../../../src/server/models/mongo/task";

interface DeleteTaskResponse {
    success: boolean;
    data: {
        deleted: boolean;
    };
    error?: string;
}

export async function runDeleteTaskTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.taskIds) {
        throw new Error('missing required context for delete test');
    }

    const deleteResponse = await axios.delete<DeleteTaskResponse>(
        `${context.baseUrl}/api/tasks/${context.taskIds[0]}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!deleteResponse.data.success) throw new Error('failed to delete task');

    const tasks = await TaskModel.find({
        userId: new Types.ObjectId(context.userId)
    });

    if (tasks.length !== 1) throw new Error(`expected 1 remaining task, found ${tasks.length}`);
    if (tasks[0]._id.toString() !== context.taskIds[1]) throw new Error('wrong task was deleted');
}