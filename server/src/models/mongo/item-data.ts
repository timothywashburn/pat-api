import { Schema, model, Types } from 'mongoose';
import { AgendaItemData } from "@timothyw/pat-common";
import { v4 as uuidv4 } from 'uuid';

const itemSchema = new Schema<AgendaItemData>({
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

export const ItemModel = model<AgendaItemData>('Item', itemSchema, 'items');