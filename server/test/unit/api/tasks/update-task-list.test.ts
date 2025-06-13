import axios from 'axios';
import { TestContext } from '../../../main';
import { TaskListModel } from "../../../../src/models/mongo/task-list-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { UpdateTaskListResponse } from "../../../../src/temp/task-types";

export async function runUpdateTaskListTest(context: TestContext) {
    if (!context.taskListIds || context.taskListIds.length === 0) {
        throw new Error('No task lists available for update test');
    }

    const taskListId = context.taskListIds[0];

    const response = await axios.put<ApiResponseBody<UpdateTaskListResponse>>(
        `${context.baseUrl}/api/tasks/lists/${taskListId}`,
        {
            name: 'Updated task list name'
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) {
        throw new Error('Failed to update task list');
    }

    const updatedTaskList = response.data.data!.taskList;

    if (updatedTaskList.name !== 'Updated task list name') {
        throw new Error('Task list name was not updated correctly');
    }

    // Verify in database
    const taskListInDb = await TaskListModel.findById(taskListId);
    if (!taskListInDb || taskListInDb.name !== 'Updated task list name') {
        throw new Error('Task list not properly updated in database');
    }
}