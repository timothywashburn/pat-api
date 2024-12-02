import axios from 'axios';
import { TestContext } from '../../main';
import { TaskModel } from '../../../src/server/models/mongo/task';
import { Types } from 'mongoose';

interface CompleteTaskResponse {
    success: boolean;
    data: {
        task: {
            id: string;
            name: string;
            completed: boolean;
            dueDate?: string;
            notes?: string;
        };
    };
    error?: string;
}

export async function runCompleteTaskTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.taskIds) {
        throw new Error('missing required context for complete task test');
    }

    const completeResponse = await axios.put<CompleteTaskResponse>(
        `${context.baseUrl}/api/tasks/${context.taskIds[1]}/complete`,
        { completed: true },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!completeResponse.data.success) throw new Error('failed to complete task');
    if (!completeResponse.data.data.task.completed) throw new Error('task not marked as completed');

    const task = await TaskModel.findById(new Types.ObjectId(context.taskIds[1]));
    if (!task) throw new Error('task not found in database');
    if (!task.completed) throw new Error('task not marked as completed in database');

    const uncompleteResponse = await axios.put<CompleteTaskResponse>(
        `${context.baseUrl}/api/tasks/${context.taskIds[1]}/complete`,
        { completed: false },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!uncompleteResponse.data.success) throw new Error('failed to uncomplete task');
    if (uncompleteResponse.data.data.task.completed) throw new Error('task not marked as uncompleted');

    const updatedTask = await TaskModel.findById(new Types.ObjectId(context.taskIds[1]));
    if (!updatedTask) throw new Error('task not found in database');
    if (updatedTask.completed) throw new Error('task not marked as uncompleted in database');
}