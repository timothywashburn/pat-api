import {
    Person,
    PersonId, PersonNoteData, PersonNoteId,
    PersonPropertyData,
    UpdatePersonRequest,
    UserId
} from "@timothyw/pat-common";
import { PersonModel } from "../models/mongo/person-data";
import { updateDocumentWithPopulate } from "../utils/db-doc-utils";

export default class PersonManager {
    private static instance: PersonManager;

    private constructor() {}

    async create(userId: UserId, data: {
        name: string;
        properties?: PersonPropertyData[];
        notes?: PersonNoteId[];
    }): Promise<Person> {
        const person = new PersonModel({
            userId,
            name: data.name,
            properties: data.properties || [],
            noteIds: data.notes || []
        });
        const doc = await person.save();
        const populatedPerson = await doc.populate('noteIds');
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
        userId: UserId,
        personId: PersonId,
        updates: UpdatePersonRequest
    ): Promise<Person | null> {
        const person = await updateDocumentWithPopulate(userId, PersonModel, personId, updates);
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