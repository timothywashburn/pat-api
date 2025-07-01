import { Schema, model } from 'mongoose';
import { PersonNoteData } from "@timothyw/pat-common";
import { v4 as uuidv4 } from 'uuid';

const personNoteSchema = new Schema<PersonNoteData>({
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
    personId: {
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

export const PersonNoteModel = model<PersonNoteData>('PersonNote', personNoteSchema, 'people_notes');