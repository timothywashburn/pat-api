import { Schema, model, Types } from 'mongoose';
import { PersonData, PersonProperty } from "@timothyw/pat-common";

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
    noteIds: [{
        type: String,
        ref: 'PersonNote',
        default: []
    }]
}, {
    timestamps: true,
});

export const PersonModel = model<PersonData>('Person', personSchema, 'people');