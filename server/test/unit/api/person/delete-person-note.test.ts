import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { DeletePersonNoteResponse } from "@timothyw/pat-common";
import { del } from "../../../test-utils";

export async function runDeletePersonNoteTest(context: TestContext) {
    if (context.personNoteIds.length === 0) throw new Error('no person notes to delete');

    const personNoteId = context.personNoteIds[context.personNoteIds.length - 1];

    const response = await del<DeletePersonNoteResponse>(
        context,
        `/api/people/notes/${personNoteId}`
    );

    if (!response.success) throw new Error('failed to delete person note');

    context.personNoteIds.pop();
}