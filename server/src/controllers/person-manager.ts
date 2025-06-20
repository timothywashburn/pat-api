import { Types } from "mongoose";
import {
    ItemData,
    ItemId, Person,
    PersonData,
    PersonId, PersonNoteData, PersonNoteId,
    PersonProperty,
    UpdateItemRequest, UpdatePersonRequest, UpdatePersonResponse,
    UserId
} from "@timothyw/pat-common";
import { PersonModel } from "../models/mongo/person-data";
import { AuthInfo } from "../api/types";
import { updateDocument, updateDocumentWithPopulate } from "../utils/db-doc-utils";
import { ItemModel } from "../models/mongo/item-data";

interface CreateNoteInput {
    content: string;
}

export default class PersonManager {
    private static instance: PersonManager;

    private constructor() {}

    async create(userId: UserId, data: {
        name: string;
        properties?: PersonProperty[];
        notes?: PersonNoteId[];
    }): Promise<Person> {
        const person = new PersonModel({
            userId,
            name: data.name,
            properties: data.properties || [],
            noteIds: data.notes || []
        });
        const personData = await person.save();
        const populatedPerson = await personData.populate('noteIds');
        const personObj = populatedPerson.toObject();
        
        return {
            ...personObj,
            notes: personObj.noteIds as unknown as PersonNoteData[],
        } as Person;
    }

    async getAllByUser(userId: UserId): Promise<Person[]> {
        const people = await PersonModel.find({ userId }).populate('noteIds');

        return people.map(person => {
            const personObj = person.toObject();
            return {
                ...personObj,
                notes: personObj.noteIds as unknown as PersonNoteData[],
            } as Person;
        })
    }

    async update(
        auth: AuthInfo,
        personId: PersonId,
        updates: UpdatePersonRequest
    ): Promise<Person | null> {
        const person = await updateDocumentWithPopulate(auth, PersonModel, personId, updates);
        if (!person) return null;
        
        const populatedPerson = await person.populate('noteIds');
        const personObj = populatedPerson.toObject();
        return {
            ...personObj,
            notes: personObj.noteIds as unknown as PersonNoteData[],
        } as Person;
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

    async addNoteId(personId: PersonId, noteId: PersonNoteId): Promise<boolean> {
        const result = await PersonModel.updateOne(
            { _id: personId },
            { $addToSet: { noteIds: noteId } }
        );
        return result.modifiedCount > 0;
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