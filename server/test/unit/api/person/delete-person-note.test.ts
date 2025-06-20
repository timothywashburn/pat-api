import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { DeletePersonNoteResponse } from "@timothyw/pat-common";

export async function runDeletePersonNoteTest(context: TestContext) {
    if (context.personNoteIds.length === 0) throw new Error('no person notes to delete');

    const personNoteId = context.personNoteIds[context.personNoteIds.length - 1];

    const response = await axios.delete<ApiResponseBody<DeletePersonNoteResponse>>(
        `${context.baseUrl}/api/people/notes/${personNoteId}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to delete person note');

    context.personNoteIds.pop();
}