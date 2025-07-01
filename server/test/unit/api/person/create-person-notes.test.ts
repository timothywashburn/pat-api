import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import { PersonNoteModel } from '../../../../src/models/mongo/person-note-data';
import { CreatePersonNoteResponse, PersonNoteId } from "@timothyw/pat-common";
import { ApiResponseBody } from "../../../../src/api/types";

export async function runCreatePersonNotesTest(context: TestContext) {
    await createPersonNote(context, { content: 'First person note that should be updated later' });
    await createPersonNote(context, { content: 'Second person note' });
    await createPersonNote(context, { content: 'Person note to delete' });

    const personNotes = await PersonNoteModel.find({
        userId: context.userId
    });

    if (personNotes.length !== context.personNoteIds.length)
        throw new Error(`expected ${context.personNoteIds.length === 1 ? "1 person note" : context.personNoteIds.length + " person notes"}, found ${personNotes.length}`);
}

async function createPersonNote(context: TestContext, data: Record<string, any>) {
    const response = await axios.post<ApiResponseBody<CreatePersonNoteResponse>>(
        `${context.baseUrl}/api/people/notes`,
        { ...data },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error(`failed to create person note: ${data.content}`);
    context.personNoteIds.push(response.data.data!.personNote._id);
}