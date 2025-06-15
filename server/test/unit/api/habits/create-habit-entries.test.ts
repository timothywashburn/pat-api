import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { CreateHabitEntryResponse } from "../../../../src/api/endpoints/habits/create-habit-entry";

export async function runCreateHabitEntriesTest(context: TestContext) {
    if (context.habitIds.length === 0) {
        throw new Error('no habits available to create entries for');
    }

    const habitId = context.habitIds[0];
    const today = new Date();
    
    // Only create entries for today since we just created the habit
    // Create completed entry for today
    await createHabitEntry(context, habitId, {
        date: today.toISOString().split('T')[0],
        status: 'completed'
    });

    // Test updating the same entry
    await createHabitEntry(context, habitId, {
        date: today.toISOString().split('T')[0],
        status: 'missed'
    });

    // Create another completed entry for today to test final state
    await createHabitEntry(context, habitId, {
        date: today.toISOString().split('T')[0],
        status: 'completed'
    });

    // Verify the final state
    const response = await axios.get<ApiResponseBody<any>>(
        `${context.baseUrl}/api/habits`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    const habit = response.data.data!.habits.find((h: any) => h.id === habitId);
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

async function createHabitEntry(context: TestContext, habitId: string, data: Record<string, any>) {
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