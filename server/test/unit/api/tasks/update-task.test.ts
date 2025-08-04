import { TestContext } from '../../../main';
import { TaskModel } from "../../../../src/models/mongo/task-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { UpdateTaskResponse } from "@timothyw/pat-common";
import { put } from "../../../test-utils";

export async function runUpdateTaskTest(context: TestContext) {
    if (!context.taskIds || context.taskIds.length === 0) {
        throw new Error('No tasks available for update test');
    }

    const taskId = context.taskIds[0];

    const updates = {
        name: 'Updated task name',
        notes: 'Updated task notes'
    };

    const response = await put<typeof updates, UpdateTaskResponse>(
        context,
        `/api/tasks/${taskId}`,
        updates
    );

    if (!response.success) {
        throw new Error('Failed to update task');
    }

    const updatedTask = response.task;
    if (updatedTask.name !== updates.name) throw new Error('Task name was not updated correctly');
    if (updatedTask.notes !== updates.notes) throw new Error('Task notes were not updated correctly');
    const taskInDb = await TaskModel.findById(taskId);
    if (!taskInDb || taskInDb.name !== updates.name) {
        throw new Error('Task not properly updated in database');
    }
}
