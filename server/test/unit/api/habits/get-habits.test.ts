import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetHabitsResponse } from "@timothyw/pat-common";

export async function runGetHabitsTest(context: TestContext) {
    const response = await axios.get<ApiResponseBody<GetHabitsResponse>>(
        `${context.baseUrl}/api/habits`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to fetch habits');
    if (!Array.isArray(response.data.data!.habits)) throw new Error('invalid habits response format');

    if (response.data.data!.habits.length != context.habitIds.length)
        throw new Error(`expected ${context.habitIds.length} habit${context.habitIds.length == 1 ? "" : "s"}, found ${response.data.data!.habits.length}`);
}