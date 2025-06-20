import { Schema, model } from 'mongoose';
import { PersonNoteData } from "@timothyw/pat-common";

const personNoteSchema = new Schema<PersonNoteData>({
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