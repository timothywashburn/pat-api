import { Types } from "mongoose";
import {
    ItemData,
    ItemId,
    PersonData,
    PersonId, PersonNoteId,
    PersonProperty,
    UpdateItemRequest, UpdatePersonRequest, UpdatePersonResponse,
    UserId
} from "@timothyw/pat-common";
import { PersonModel } from "../models/mongo/person-data";
import { AuthInfo } from "../api/types";
import { updateDocument } from "../utils/db-doc-utils";
import { ItemModel } from "../models/mongo/item-data";

interface CreateNoteInput {
    content: string;
}

export default class PersonManager {
    private static instance: PersonManager;

    private constructor() {}

    create(userId: UserId, data: {
        name: string;
        properties?: PersonProperty[];
        notes?: PersonNoteId[];
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
        return PersonModel.find({ userId }).lean();
    }

    update(
        auth: AuthInfo,
        personId: PersonId,
        updates: UpdatePersonRequest
    ): Promise<PersonData | null> {
        return updateDocument(auth, PersonModel, personId, updates);
    }

    // update(personId: PersonId, updates: {
    //     name?: string;
    //     properties?: PersonProperty[];
    //     notes?: CreateNoteInput[];
    // }): Promise<PersonData | null> {
    //     return PersonModel.findByIdAndUpdate(
    //         personId,
    //         { $set: updates },
    //         { new: true }
    //     );
    // }

    delete(personId: PersonId): Promise<boolean> {
        return PersonModel.deleteOne({ _id: personId })
            .then(result => result.deletedCount > 0);
    }

    static getInstance(): PersonManager {
        if (!PersonManager.instance) PersonManager.instance = new PersonManager();
        return PersonManager.instance;
    }
}