import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetThoughtsResponse, Serializer } from "@timothyw/pat-common";
import { get } from "../../../test-utils";

export async function runGetThoughtsTest(context: TestContext) {
    const response = await get<{}, GetThoughtsResponse>(
        context,
        "/api/thoughts"
    );

    if (!response.success) throw new Error('failed to fetch thoughts');
    if (!Array.isArray(response.thoughts)) throw new Error('invalid thoughts response format');
    
    const thoughts = response.thoughts.map(t => Serializer.deserializeThoughtData(t));
    if (context.thoughtIds && thoughts.length !== context.thoughtIds.length) {
        const count = context.thoughtIds.length;
        throw new Error(`expected ${count} thought${count == 1 ? '' : 's'}, found ${thoughts.length}`);
    }
}
