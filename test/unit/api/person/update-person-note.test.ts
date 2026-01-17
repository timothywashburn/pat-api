import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { UpdatePersonNoteResponse } from "@timothyw/pat-common";
import { put } from "../../../test-utils";

export async function runUpdatePersonNoteTest(context: TestContext) {
    if (context.personNoteIds.length === 0) throw new Error('no person notes to update');

    const personNoteId = context.personNoteIds[0];
    const updatedContent = 'Updated first person note';

    const response = await put<{ content: string }, UpdatePersonNoteResponse>(
        context,
        `/api/people/notes/${personNoteId}`,
        { content: updatedContent }
    );

    if (!response.success) throw new Error('failed to update person note');

    const personNote = response.personNote;
    if (personNote.content !== updatedContent)
        throw new Error(`expected content to be "${updatedContent}", found "${personNote.content}"`);
}