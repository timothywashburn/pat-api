import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import {
    CreateHabitEntryRequest,
    CreateHabitEntryResponse,
    GetHabitsResponse,
    Habit,
    toDateString
} from "@timothyw/pat-common";
import { HabitEntryStatus } from "@timothyw/pat-common/dist/types/models/habit-data";

export async function runCreateHabitEntriesTest(context: TestContext) {
    if (context.habitIds.length === 0) {
        throw new Error('no habits available to create entries for');
    }

    const today = new Date();
    
    // Only create entries for today since we just created the habit
    // Create completed entry for today
    await createHabitEntry(context, context.habitIds[0], {
        date: toDateString(today),
        status: HabitEntryStatus.COMPLETED
    });

    // Test updating the same entry
    await createHabitEntry(context, context.habitIds[1], {
        date: toDateString(today),
        status: HabitEntryStatus.EXCUSED
    });

    // Create another completed entry for today to test final state
    await createHabitEntry(context, context.habitIds[2], {
        date: toDateString(today),
        status: HabitEntryStatus.COMPLETED
    });

    // Verify the final state
    const response = await axios.get<ApiResponseBody<GetHabitsResponse>>(
        `${context.baseUrl}/api/habits`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    const habit = response.data.data!.habits.find((h: Habit) => h._id === context.habitIds[0]);
    if (!habit) throw new Error('habit not found');
    
    if (habit.entries.length !== 1) {
        throw new Error(`expected 1 entry, found ${habit.entries.length}`);
    }

    // Verify the final entry status is 'completed'
    const entry = habit.entries[0];
    if (entry.status !== 'completed') {
        throw new Error(`expected final entry status to be 'completed', found '${entry.status}'`);
    }

    // Verify stats are calculated correctly
    if (habit.stats.completedDays !== 1) {
        throw new Error(`expected 1 completed day, found ${habit.stats.completedDays}`);
    }
    if (habit.stats.totalDays !== 1) {
        throw new Error(`expected 1 total day, found ${habit.stats.totalDays}`);
    }
}

async function createHabitEntry(context: TestContext, habitId: string, data: CreateHabitEntryRequest) {
    const response = await axios.post<ApiResponseBody<CreateHabitEntryResponse>>(
        `${context.baseUrl}/api/habits/${habitId}/entries`,
        data,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error(`failed to create habit entry: ${data.date}`);
}