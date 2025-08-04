import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import { ThoughtModel } from '../../../../src/models/mongo/thought-data';
import { CreateThoughtResponse, ThoughtId, Serializer } from "@timothyw/pat-common";
import { ApiResponseBody } from "../../../../src/api/types";
import { post } from "../../../test-utils";

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
    const response = await post<Record<string, any>, CreateThoughtResponse>(
        context,
        "/api/thoughts",
        { ...data }
    );

    if (!response.success) throw new Error(`failed to create thought: ${data.content}`);
    const thought = Serializer.deserializeThoughtData(response.thought);
    context.thoughtIds.push(thought._id);
}
