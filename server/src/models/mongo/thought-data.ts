import { Schema, model, Types } from 'mongoose';

interface ThoughtData {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    content: string;
}

const thoughtSchema = new Schema<ThoughtData>({
    userId: {
        type: Schema.Types.ObjectId,
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

const ThoughtModel = model<ThoughtData>('Thought', thoughtSchema);

export {
    ThoughtData,
    ThoughtModel,
};