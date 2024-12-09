import axios from 'axios';
import { TestContext } from '../../main';
import { TaskModel } from '../../../src/server/models/mongo/task';
import { Types } from 'mongoose';

interface UpdateTaskResponse {
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

export async function runUpdateTaskTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.taskIds) {
        throw new Error('missing required context for update task test');
    }

    const updates = {
        name: 'Updated Task Name',
        notes: 'Updated task notes'
    };

    const updateResponse = await axios.put<UpdateTaskResponse>(
        `${context.baseUrl}/api/tasks/${context.taskIds[1]}`,
        updates,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!updateResponse.data.success) throw new Error('failed to update task');
    if (updateResponse.data.data.task.name !== updates.name) throw new Error('name not updated in response');
    if (updateResponse.data.data.task.notes !== updates.notes) throw new Error('notes not updated in response');

    const task = await TaskModel.findById(new Types.ObjectId(context.taskIds[1]));
    if (!task) throw new Error('task not found in database');
    if (task.name !== updates.name) throw new Error('name not updated in database');
    if (task.notes !== updates.notes) throw new Error('notes not updated in database');
}