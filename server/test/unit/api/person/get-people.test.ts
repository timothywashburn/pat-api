import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetPeopleResponse } from "@timothyw/pat-common";

export async function runGetPeopleTest(context: TestContext) {
    const response = await axios.get<ApiResponseBody<GetPeopleResponse>>(
        `${context.baseUrl}/api/people`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to fetch people');
    if (!Array.isArray(response.data.data!.people)) throw new Error('invalid people response format');

    if (context.personIds && response.data.data!.people.length !== context.personIds.length) {
        const count = context.personIds.length;
        throw new Error(`expected ${count} ${count == 1 ? 'person' : 'people'}, found ${response.data.data!.people.length}`);
    }
}
