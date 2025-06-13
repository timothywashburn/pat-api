import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetThoughtsResponse } from "@timothyw/pat-common";

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

    if (context.thoughtIds && response.data.data!.thoughts.length !== context.thoughtIds.length) {
        const count = context.thoughtIds.length;
        throw new Error(`expected ${count} thought${count == 1 ? '' : 's'}, found ${response.data.data!.thoughts.length}`);
    }
}
