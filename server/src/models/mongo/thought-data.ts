import { Schema, model, Types } from 'mongoose';
import { ThoughtData } from "@timothyw/pat-common";

const thoughtSchema = new Schema<ThoughtData>({
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

export const ThoughtModel = model<ThoughtData>('Thought', thoughtSchema);