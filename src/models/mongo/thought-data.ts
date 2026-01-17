import { Schema, model, Types } from 'mongoose';
import { ThoughtData } from "@timothyw/pat-common";
import { v4 as uuidv4 } from 'uuid';

const thoughtSchema = new Schema<ThoughtData>({
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
    content: {
        type: String,
        required: true,
        trim: true,
    }
}, {
    timestamps: true,
});

export const ThoughtModel = model<ThoughtData>('Thought', thoughtSchema, 'thoughts');