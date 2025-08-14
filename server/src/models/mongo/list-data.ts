import { Schema, model } from 'mongoose';
import { ListData, ListType } from "@timothyw/pat-common";
import { v4 as uuidv4 } from 'uuid';

const listSchema = new Schema<ListData>({
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
    type: {
        type: String,
        enum: Object.values(ListType),
        required: true,
        default: ListType.TASKS
    }
}, {
    timestamps: true,
});

// TODO: change these
export const ListModel = model<ListData>('TaskList', listSchema, 'task_lists');