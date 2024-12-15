import { Schema, model, Types } from 'mongoose';

interface PersonProperty {
    key: string;
    value: string;
}

interface PersonNote {
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

interface PersonData {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    properties: PersonProperty[];
    notes: PersonNote[];
}

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
        type: Schema.Types.ObjectId,
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

const PersonModel = model<PersonData>('Person', personSchema);

export {
    PersonData,
    PersonModel,
    PersonProperty,
    PersonNote
};