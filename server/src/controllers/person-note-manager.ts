import {
    PersonNoteData,
    PersonNoteId,
    PersonId,
    UpdatePersonNoteRequest,
    UserId,
    CreatePersonRequest, CreatePersonNoteRequest
} from "@timothyw/pat-common";
import { PersonNoteModel } from "../models/mongo/person-note-data";
import { AuthInfo } from "../api/types";
import { updateDocument } from "../utils/db-doc-utils";
import PersonManager from "./person-manager";

export default class PersonNoteManager {
    private static instance: PersonNoteManager;

    private constructor() {}

    async create(userId: UserId, data: CreatePersonNoteRequest): Promise<PersonNoteData & { userId: string }> {
        const personNote = new PersonNoteModel({
            userId,
            personId: data.personId,
            content: data.content
        });
        const doc = await personNote.save();
        await PersonManager.getInstance().addNoteId(data.personId, doc._id);
        return doc.toObject();
    }

    getAllByUser(userId: UserId): Promise<(PersonNoteData)[]> {
        return PersonNoteModel.find({ userId }).lean();
    }

    update(
        auth: AuthInfo,
        personNoteId: PersonNoteId,
        updates: UpdatePersonNoteRequest
    ): Promise<PersonNoteData | null> {
        return updateDocument(auth, PersonNoteModel, personNoteId, updates);
    }

    delete(personNoteId: PersonNoteId): Promise<boolean> {
        return PersonNoteModel.deleteOne({ _id: personNoteId })
            .then(result => result.deletedCount > 0);
    }

    static getInstance(): PersonNoteManager {
        if (!PersonNoteManager.instance) PersonNoteManager.instance = new PersonNoteManager();
        return PersonNoteManager.instance;
    }
}