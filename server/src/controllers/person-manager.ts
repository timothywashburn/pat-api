import { Types } from "mongoose";
import { PersonData, PersonId, PersonProperty, UserId } from "@timothyw/pat-common";
import { PersonModel } from "../models/mongo/person.data";

interface CreateNoteInput {
    content: string;
}

export default class PersonManager {
    private static instance: PersonManager;

    private constructor() {}

    create(userId: UserId, data: {
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

    getAllByUser(userId: UserId): Promise<PersonData[]> {
        return PersonModel.find({ userId });
    }

    update(personId: PersonId, updates: {
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

    delete(personId: PersonId): Promise<boolean> {
        return PersonModel.deleteOne({ _id: personId })
            .then(result => result.deletedCount > 0);
    }

    static getInstance(): PersonManager {
        if (!PersonManager.instance) PersonManager.instance = new PersonManager();
        return PersonManager.instance;
    }
}