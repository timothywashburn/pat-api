import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import { ThoughtModel } from '../../../../src/models/mongo/thought-data';
import { CreateThoughtResponse, ThoughtId } from "@timothyw/pat-common";
import { ApiResponseBody } from "../../../../src/api/types";

export async function runCreateThoughtsTest(context: TestContext) {
    const thought1Response = await axios.post<ApiResponseBody<CreateThoughtResponse>>(
        `${context.baseUrl}/api/thoughts`,
        {
            content: 'fruit is yummy'
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!thought1Response.data.success) throw new Error('failed to create first thought');

    const thought2Response = await axios.post<ApiResponseBody<CreateThoughtResponse>>(
        `${context.baseUrl}/api/thoughts`,
        {
            content: 'aaaaaaaa'
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!thought2Response.data.success) throw new Error('failed to create second thought');

    context.thoughtIds = [
        thought1Response.data.data!.thought.id as ThoughtId,
        thought2Response.data.data!.thought.id as ThoughtId
    ];

    const thoughts = await ThoughtModel.find({
        userId: new Types.ObjectId(context.userId)
    });

    if (thoughts.length !== 2) throw new Error(`expected 2 thoughts, found ${thoughts.length}`);
}