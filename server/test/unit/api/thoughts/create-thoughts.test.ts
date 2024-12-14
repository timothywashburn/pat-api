import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import { ThoughtModel } from '../../../../src/models/mongo/thought-data';

interface CreateThoughtResponse {
    success: boolean;
    data: {
        thought: {
            id: string;
            content: string;
        };
    };
    error?: string;
}

export async function runCreateThoughtsTest(context: TestContext) {
    const thought1Response = await axios.post<CreateThoughtResponse>(
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

    const thought2Response = await axios.post<CreateThoughtResponse>(
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
        thought1Response.data.data.thought.id,
        thought2Response.data.data.thought.id
    ];

    const thoughts = await ThoughtModel.find({
        userId: new Types.ObjectId(context.userId)
    });

    if (thoughts.length !== 2) throw new Error(`expected 2 thoughts, found ${thoughts.length}`);
}