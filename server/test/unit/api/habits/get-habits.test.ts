import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetHabitsResponse } from "../../../../src/api/endpoints/habits/get-habits";

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

    // Verify each habit has the expected structure
    for (const habit of response.data.data!.habits) {
        if (!habit.id || !habit.name || !habit.frequency || !habit.rolloverTime) {
            throw new Error('habit missing required fields');
        }
        if (!Array.isArray(habit.entries)) {
            throw new Error('habit entries should be an array');
        }
        if (!habit.stats || typeof habit.stats.totalDays !== 'number') {
            throw new Error('habit stats missing or invalid');
        }
    }
}