import { Schema, model } from 'mongoose';
import { ListItemData } from "@timothyw/pat-common";
import { v4 as uuidv4 } from 'uuid';

const listItemSchema = new Schema<ListItemData>({
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
    listId: {
        type: String,
        required: true,
        index: true,
    }
}, {
    timestamps: true,
});

export const ListItemModel = model<ListItemData>('ListItem', listItemSchema, 'list_items');