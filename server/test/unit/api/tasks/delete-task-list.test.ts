import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import { TaskListModel } from "../../../../src/models/mongo/task-list-data";
import { TaskModel } from "../../../../src/models/mongo/task-data";
import { ApiResponseBody } from "../../../../src/api/types";

export async function runDeleteTaskListTest(context: TestContext) {
    if (!context.taskListIds || context.taskListIds.length < 2) {
        throw new Error('Need at least 2 task lists for delete test');
    }

    const deleteId = context.taskListIds.pop();

    const response = await axios.delete<ApiResponseBody<{ success: boolean }>>(
        `${context.baseUrl}/api/tasks/lists/${deleteId}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) {
        throw new Error('Failed to delete task list');
    }

    const taskListInDb = await TaskListModel.findById(deleteId);
    if (taskListInDb) {
        throw new Error('Task list should have been deleted from database');
    }

    const remainingTasksInList = await TaskModel.find({ taskListId: deleteId });
    if (remainingTasksInList.length > 0) {
        throw new Error('All tasks in deleted task list should also be deleted');
    }

    for (let i = 0; i < context.taskListIds.length; i++) {
        const taskList = await TaskListModel.findOne({
            _id: new Types.ObjectId(context.taskListIds[i]),
            userId: context.userId
        });

        if (!taskList) throw new Error(`Task list with id ${context.taskListIds[i]} not found`);
    }
}
