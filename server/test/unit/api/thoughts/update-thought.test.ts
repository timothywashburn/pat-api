import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import { ThoughtModel } from '../../../../src/models/mongo/thought-data';
import { ApiResponseBody } from "../../../../src/api/types";
import { UpdateThoughtResponse } from "@timothyw/pat-common";

export async function runUpdateThoughtTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.thoughtIds) {
        throw new Error('missing required context for update thought test');
    }

    const updates = {
        content: 'fruit is yummy yayayyayay'
    };

    const updateResponse = await axios.put<ApiResponseBody<UpdateThoughtResponse>>(
        `${context.baseUrl}/api/thoughts/${context.thoughtIds[0]}`,
        updates,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!updateResponse.data.success) throw new Error('failed to update thought');
    if (updateResponse.data.data!.thought.content !== updates.content) throw new Error('content not updated');

    const thought = await ThoughtModel.findById(new Types.ObjectId(context.thoughtIds[0]));
    if (!thought) throw new Error('thought not found in database');
    if (thought.content !== updates.content) throw new Error('content not updated in database');
}