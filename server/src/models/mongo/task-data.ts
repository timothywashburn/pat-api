import { Schema, model } from 'mongoose';
import { TaskData } from "@timothyw/pat-common";
import { v4 as uuidv4 } from 'uuid';

const taskSchema = new Schema<TaskData>({
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
    },
    notes: {
        type: String,
        trim: true,
    },
    completed: {
        type: Boolean,
        default: false,
    },
    taskListId: {
        type: String,
        required: true,
        index: true,
    }
}, {
    timestamps: true,
});

export const TaskModel = model<TaskData>('Task', taskSchema, 'tasks');