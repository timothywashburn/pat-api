import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetPersonNotesResponse, Serializer } from "@timothyw/pat-common";

export async function runGetPersonNotesTest(context: TestContext) {
    const response = await axios.get<ApiResponseBody<GetPersonNotesResponse>>(
        `${context.baseUrl}/api/people/notes`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to get person notes');

    const personNotes = response.data.data!.personNotes.map(note => Serializer.deserializePersonNoteData(note));
    if (personNotes.length !== context.personNoteIds.length)
        throw new Error(`expected ${context.personNoteIds.length} person notes, found ${personNotes.length}`);

    for (const personNote of personNotes) {
        if (!context.personNoteIds.includes(personNote._id))
            throw new Error(`found unexpected person note: ${personNote._id}`);
    }
}