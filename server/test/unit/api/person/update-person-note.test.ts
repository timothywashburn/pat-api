import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { UpdatePersonNoteResponse } from "@timothyw/pat-common";

export async function runUpdatePersonNoteTest(context: TestContext) {
    if (context.personNoteIds.length === 0) throw new Error('no person notes to update');

    const personNoteId = context.personNoteIds[0];
    const updatedContent = 'Updated first person note';

    const response = await axios.put<ApiResponseBody<UpdatePersonNoteResponse>>(
        `${context.baseUrl}/api/people/notes/${personNoteId}`,
        { content: updatedContent },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to update person note');

    const personNote = response.data.data!.personNote;
    if (personNote.content !== updatedContent)
        throw new Error(`expected content to be "${updatedContent}", found "${personNote.content}"`);
}