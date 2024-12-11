import { Schema, model, Types } from 'mongoose';

interface ItemData {
    _id: Types.ObjectId;
    userId: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;

    name: string;
    dueDate?: Date | null;
    notes?: string;
    completed: boolean;
    urgent: boolean;
    category?: string | null;
    type?: string | null;
}

const itemSchema = new Schema<ItemData>({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    dueDate: {
        type: Date
    },
    notes: {
        type: String,
        trim: true,
    },
    completed: {
        type: Boolean,
        default: false,
    },
    urgent: {
        type: Boolean,
        default: false,
    },
    category: {
        type: String,
        trim: true,
    },
    type: {
        type: String,
        trim: true,
    }
}, {
    timestamps: true,
});

const ItemModel = model<ItemData>('Item', itemSchema);

export {
    ItemData,
    ItemModel,
};