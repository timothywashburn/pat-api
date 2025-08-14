import { TestContext } from '../../../main';
import { ApiResponseBody, isSuccess } from "../../../../src/api/types";
import {
    CreateHabitEntryRequest,
    CreateHabitEntryResponse,
    GetHabitsResponse,
    Habit, Serializer,
    toDateString
} from "@timothyw/pat-common";
import { HabitEntryStatus } from "@timothyw/pat-common/dist/types/models/habit-data";
import DateUtils from "../../../../src/utils/date-utils";
import { get, post } from "../../../test-utils";

// todo: this whole test is kinda cursed now because the habit cannot be marked done yesterday and the rollover could mean its only able to be marked done yesterday
export async function runCreateHabitEntriesTest(context: TestContext) {
    if (context.habitIds.length === 0) {
        throw new Error('no habits available to create entries for');
    }

    const today = new Date();

    // Only create entries for today since we just created the habit
    // Create completed entry for today
    await createHabitEntry(context, context.habitIds[0], {
        date: DateUtils.toLocalDateOnlyString(today, 'America/Los_Angeles'),
        status: HabitEntryStatus.COMPLETED
    });

    // Test updating the same entry
    await createHabitEntry(context, context.habitIds[1], {
        date: DateUtils.toLocalDateOnlyString(today, 'America/Los_Angeles'),
        status: HabitEntryStatus.EXCUSED
    });

    // Create another completed entry for today to test final state
    await createHabitEntry(context, context.habitIds[2], {
        date: DateUtils.toLocalDateOnlyString(today, 'America/Los_Angeles'),
        status: HabitEntryStatus.COMPLETED
    });

    // Verify the final state
    const response = await get<{}, GetHabitsResponse>(
        context,
        "/api/habits"
    );

    if (!isSuccess(response)) throw new Error(`failed to fetch habits: ${response.error}`);

    const habits = response.habits.map(h => Serializer.deserialize<Habit>(h));
    const habit = habits.find((h: Habit) => h._id === context.habitIds[0]);
    if (!habit) throw new Error('habit not found');

    if (habit.entries.length !== 1) {
        throw new Error(`expected 1 entry, found ${habit.entries.length}`);
    }

    // Verify the final entry status is 'completed'
    const entry = habit.entries[0];
    if (entry.status !== 'completed') {
        throw new Error(`expected final entry status to be 'completed', found '${entry.status}'`);
    }
}

async function createHabitEntry(context: TestContext, habitId: string, data: CreateHabitEntryRequest) {
    const response = await post<CreateHabitEntryRequest, CreateHabitEntryResponse>(
        context,
        `/api/habits/${habitId}/entries`,
        data
    );

    if (!response.success) throw new Error(`failed to create habit entry: ${data.date}`);
}