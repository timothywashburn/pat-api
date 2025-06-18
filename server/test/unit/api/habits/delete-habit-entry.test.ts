import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { DeleteHabitEntryResponse } from "@timothyw/pat-common";
import DateUtils from "../../../../src/utils/date-utils";

export async function runDeleteHabitEntryTest(context: TestContext) {
    if (context.habitIds.length === 0) {
        throw new Error('no habits available to delete entries from');
    }

    const habitId = context.habitIds[context.habitIds.length - 1];
    const dateOnlyString = DateUtils.toLocalDateOnlyString(new Date(), 'America/Los_Angeles');

    // Delete the entry from today
    const response = await axios.delete<ApiResponseBody<DeleteHabitEntryResponse>>(
        `${context.baseUrl}/api/habits/${habitId}/entries/${dateOnlyString}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to delete habit entry');

    // Verify the entry was deleted by checking the updated habit
    const habit = response.data.data!.habit;
    if (habit.entries.length !== 0) throw new Error(`expected 0 entries after deletion, found ${habit.entries.length}`);
}