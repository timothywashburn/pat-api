import axios from 'axios';
import { TestContext } from '../../main';
import { Types } from 'mongoose';
import {TaskModel} from "../../../src/server/models/mongo/task";

interface CreateTaskResponse {
    success: boolean;
    data: {
        task: {
            id: string;
            name: string;
            dueDate?: string;
            notes?: string;
            completed: boolean;
        };
    };
    error?: string;
}

export async function runCreateTasksTest(context: TestContext) {
    const task1Response = await axios.post<CreateTaskResponse>(
        `${context.baseUrl}/api/tasks`,
        {
            name: 'First test task',
            userId: context.userId,
            notes: 'First task for testing'
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!task1Response.data.success) throw new Error('failed to create first task');

    const task2Response = await axios.post<CreateTaskResponse>(
        `${context.baseUrl}/api/tasks`,
        {
            name: 'Second test task',
            userId: context.userId,
            notes: 'Second task for testing'
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!task2Response.data.success) throw new Error('failed to create second task');

    context.taskIds = [
        task1Response.data.data.task.id,
        task2Response.data.data.task.id
    ];

    const tasks = await TaskModel.find({
        userId: new Types.ObjectId(context.userId)
    });

    if (tasks.length !== 2) {
        throw new Error(`expected 2 tasks, found ${tasks.length}`);
    }
}