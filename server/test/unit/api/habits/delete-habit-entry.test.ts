import { TestContext } from '../../../main';
import { DeleteHabitEntryResponse } from "@timothyw/pat-common";
import DateUtils from "../../../../src/utils/date-utils";
import { del } from "../../../test-utils";

export async function runDeleteHabitEntryTest(context: TestContext) {
    if (context.habitIds.length === 0) {
        throw new Error('no habits available to delete entries from');
    }

    const habitId = context.habitIds[context.habitIds.length - 1];
    const dateOnlyString = DateUtils.toLocalDateOnlyString(new Date(), 'America/Los_Angeles');

    // Delete the entry from today
    const response = await del<DeleteHabitEntryResponse>(
        context,
        `/api/habits/${habitId}/entries/${dateOnlyString}`
    );

    if (!response.success) throw new Error('failed to delete habit entry');
}