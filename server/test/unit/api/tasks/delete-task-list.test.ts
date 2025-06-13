import axios from 'axios';
import { TestContext } from '../../../main';
import { TaskListModel } from "../../../../src/models/mongo/task-list-data";
import { TaskModel } from "../../../../src/models/mongo/task-data";
import { ApiResponseBody } from "../../../../src/api/types";

export async function runDeleteTaskListTest(context: TestContext) {
    if (!context.taskListIds || context.taskListIds.length < 2) {
        throw new Error('Need at least 2 task lists for delete test');
    }

    const taskListId = context.taskListIds[1]; // Delete the second task list

    // First verify there are tasks in this task list that should be deleted
    const tasksInList = await TaskModel.find({ taskListId });
    console.log(`Found ${tasksInList.length} tasks in task list to be deleted`);

    const response = await axios.delete<ApiResponseBody<{ success: boolean }>>(
        `${context.baseUrl}/api/tasks/lists/${taskListId}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) {
        throw new Error('Failed to delete task list');
    }

    // Verify task list is deleted from database
    const taskListInDb = await TaskListModel.findById(taskListId);
    if (taskListInDb) {
        throw new Error('Task list should have been deleted from database');
    }

    // Verify all tasks in this task list are also deleted
    const remainingTasksInList = await TaskModel.find({ taskListId });
    if (remainingTasksInList.length > 0) {
        throw new Error('All tasks in deleted task list should also be deleted');
    }

    // Remove from context
    context.taskListIds = context.taskListIds.filter(id => id !== taskListId);

    // Verify remaining task lists still exist
    const remainingTaskLists = await TaskListModel.find({
        userId: context.userId
    });

    if (remainingTaskLists.length !== 1) {
        throw new Error(`Expected 1 remaining task list, found ${remainingTaskLists.length}`);
    }
}