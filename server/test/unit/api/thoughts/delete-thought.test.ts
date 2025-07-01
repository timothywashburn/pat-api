import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import { ThoughtModel } from '../../../../src/models/mongo/thought-data';
import { ApiResponseBody } from "../../../../src/api/types";
import { DeleteThoughtResponse } from "@timothyw/pat-common";

export async function runDeleteThoughtTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.thoughtIds) {
        throw new Error('missing required context for delete test');
    }

    const deleteId = context.thoughtIds.pop();

    const deleteResponse = await axios.delete<ApiResponseBody<DeleteThoughtResponse>>(
        `${context.baseUrl}/api/thoughts/${deleteId}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!deleteResponse.data.success) throw new Error('failed to delete thought');

    for (let i = 0; i < context.thoughtIds.length; i++) {
        const thought = await ThoughtModel.findOne({
            _id: context.thoughtIds[i],
            userId: context.userId
        });

        if (!thought) throw new Error(`thought with id ${context.thoughtIds[i]} not found`);
    }
}
