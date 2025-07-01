import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import { ThoughtModel } from '../../../../src/models/mongo/thought-data';
import { CreateThoughtResponse, ThoughtId } from "@timothyw/pat-common";
import { ApiResponseBody } from "../../../../src/api/types";

export async function runCreateThoughtsTest(context: TestContext) {
    await createThought(context, { content: 'Original first thought that should be updated later' });
    await createThought(context, { content: 'Second thought' });
    await createThought(context, { content: 'Thought to delete' });

    const thoughts = await ThoughtModel.find({
        userId: context.userId
    });

    if (thoughts.length !== context.thoughtIds.length)
        throw new Error(`expected ${context.thoughtIds.length === 1 ? "1 thought" : context.thoughtIds.length + " thoughts"}, found ${thoughts.length}`);
}

async function createThought(context: TestContext, data: Record<string, any>) {
    const response = await axios.post<ApiResponseBody<CreateThoughtResponse>>(
        `${context.baseUrl}/api/thoughts`,
        { ...data },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error(`failed to create thought: ${data.content}`);
    context.thoughtIds.push(response.data.data!.thought.id as ThoughtId);
}
