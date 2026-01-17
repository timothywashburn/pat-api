import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import { ThoughtModel } from '../../../../src/models/mongo/thought-data';
import { ApiResponseBody } from "../../../../src/api/types";
import { UpdateThoughtResponse } from "@timothyw/pat-common";
import { put } from "../../../test-utils";

export async function runUpdateThoughtTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.thoughtIds) {
        throw new Error('missing required context for update thought test');
    }

    const updates = {
        content: 'First thought'
    };

    const updateResponse = await put<typeof updates, UpdateThoughtResponse>(
        context,
        `/api/thoughts/${context.thoughtIds[0]}`,
        updates
    );

    if (!updateResponse.success) throw new Error('failed to update thought');
    if (updateResponse.thought.content !== updates.content) throw new Error('content not updated');

    const thought = await ThoughtModel.findById(context.thoughtIds[0]);
    if (!thought) throw new Error('thought not found in database');
    if (thought.content !== updates.content) throw new Error('content not updated in database');
}