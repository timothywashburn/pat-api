import { Schema, model } from 'mongoose';
import { TaskListData } from "@timothyw/pat-common";

const taskListSchema = new Schema<TaskListData>({
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

export const TaskListModel = model<TaskListData>('TaskList', taskListSchema);