import { Schema, model, Types } from 'mongoose';
import { PersonData, PersonPropertyData } from "@timothyw/pat-common";
import { v4 as uuidv4 } from 'uuid';

const personPropertySchema = new Schema<PersonPropertyData>({
    key: {
        type: String,
        required: true,
    },
    value: {
        type: String,
        required: true,
        trim: true,
    }
});

const personSchema = new Schema<PersonData>({
    _id: {
        type: String,
        required: true,
        default: uuidv4,
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