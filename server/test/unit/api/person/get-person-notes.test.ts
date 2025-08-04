import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetPersonNotesResponse, Serializer } from "@timothyw/pat-common";
import { get } from "../../../test-utils";

export async function runGetPersonNotesTest(context: TestContext) {
    const response = await get<{}, GetPersonNotesResponse>(
        context,
        "/api/people/notes"
    );

    if (!response.success) throw new Error('failed to get person notes');

    const personNotes = response.personNotes.map(note => Serializer.deserializePersonNoteData(note));
    if (personNotes.length !== context.personNoteIds.length)
        throw new Error(`expected ${context.personNoteIds.length} person notes, found ${personNotes.length}`);

    for (const personNote of personNotes) {
        if (!context.personNoteIds.includes(personNote._id))
            throw new Error(`found unexpected person note: ${personNote._id}`);
    }
}