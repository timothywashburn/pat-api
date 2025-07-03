import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetThoughtsResponse, Serializer } from "@timothyw/pat-common";

export async function runGetThoughtsTest(context: TestContext) {
    const response = await axios.get<ApiResponseBody<GetThoughtsResponse>>(
        `${context.baseUrl}/api/thoughts`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to fetch thoughts');
    if (!Array.isArray(response.data.data!.thoughts)) throw new Error('invalid thoughts response format');
    
    const thoughts = response.data.data!.thoughts.map(t => Serializer.deserializeThoughtData(t));
    if (context.thoughtIds && thoughts.length !== context.thoughtIds.length) {
        const count = context.thoughtIds.length;
        throw new Error(`expected ${count} thought${count == 1 ? '' : 's'}, found ${thoughts.length}`);
    }
}
