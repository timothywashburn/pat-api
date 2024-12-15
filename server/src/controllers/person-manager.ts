import { Types } from "mongoose";
import {PersonData, PersonModel, PersonNote, PersonProperty} from "../models/mongo/person.data";

interface CreateNoteInput {
    content: string;
    order: number;
}

export default class PersonManager {
    private static instance: PersonManager;

    private constructor() {}

    create(userId: Types.ObjectId, data: {
        name: string;
        properties?: PersonProperty[];
        notes?: CreateNoteInput[];
    }): Promise<PersonData> {
        const person = new PersonModel({
            userId,
            name: data.name,
            properties: data.properties || [],
            notes: data.notes || []
        });
        return person.save();
    }

    getAllByUser(userId: Types.ObjectId): Promise<PersonData[]> {
        return PersonModel.find({ userId });
    }

    update(personId: Types.ObjectId, updates: {
        name?: string;
        properties?: PersonProperty[];
        notes?: CreateNoteInput[];
    }): Promise<PersonData | null> {
        return PersonModel.findByIdAndUpdate(
            personId,
            { $set: updates },
            { new: true }
        );
    }

    delete(personId: Types.ObjectId): Promise<boolean> {
        return PersonModel.deleteOne({ _id: personId })
            .then(result => result.deletedCount > 0);
    }

    static getInstance(): PersonManager {
        if (!PersonManager.instance) PersonManager.instance = new PersonManager();
        return PersonManager.instance;
    }
}