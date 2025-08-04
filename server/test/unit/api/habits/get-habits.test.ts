import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetHabitsResponse, Serializer } from "@timothyw/pat-common";
import { get } from "../../../test-utils";

export async function runGetHabitsTest(context: TestContext) {
    const response = await get<{}, GetHabitsResponse>(
        context,
        "/api/habits"
    );

    if (!response.success) throw new Error('failed to fetch habits');
    if (!Array.isArray(response.habits)) throw new Error('invalid habits response format');
    
    const habits = response.habits.map(h => Serializer.deserializeHabit(h));
    if (habits.length != context.habitIds.length)
        throw new Error(`expected ${context.habitIds.length} habit${context.habitIds.length == 1 ? "" : "s"}, found ${habits.length}`);
}