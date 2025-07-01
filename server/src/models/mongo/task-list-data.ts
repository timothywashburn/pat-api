import { Schema, model } from 'mongoose';
import { TaskListData } from "@timothyw/pat-common";
import { v4 as uuidv4 } from 'uuid';

const taskListSchema = new Schema<TaskListData>({
    _id: {
        type: String,
        required: true,
        default: uuidv4
    },
    userId: {
        type: String,
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    }
}, {
    timestamps: true,
});

export const TaskListModel = model<TaskListData>('TaskList', taskListSchema, 'task_lists');