import { Schema, model, Types } from 'mongoose';
import { PersonData, PersonNote, PersonProperty } from "@timothyw/pat-common";

const personPropertySchema = new Schema<PersonProperty>({
    key: {
        type: String,
        required: true,
        trim: true,
    },
    value: {
        type: String,
        required: true,
        trim: true,
    }
});

const personNoteSchema = new Schema<PersonNote>({
    content: {
        type: String,
        required: true,
        trim: true,
    }
}, {
    timestamps: true
});

const personSchema = new Schema<PersonData>({
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
    properties: [personPropertySchema],
    notes: [personNoteSchema]
}, {
    timestamps: true,
});

export const PersonModel = model<PersonData>('Person', personSchema);