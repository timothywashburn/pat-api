import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { DeleteHabitEntryResponse } from "../../../../src/api/endpoints/habits/delete-habit-entry";

export async function runDeleteHabitEntryTest(context: TestContext) {
    if (context.habitIds.length === 0) {
        throw new Error('no habits available to delete entries from');
    }

    const habitId = context.habitIds[0];
    const today = new Date();
    const dateToDelete = today.toISOString().split('T')[0];

    // Delete the entry from today
    const response = await axios.delete<ApiResponseBody<DeleteHabitEntryResponse>>(
        `${context.baseUrl}/api/habits/${habitId}/entries/${dateToDelete}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to delete habit entry');

    // Verify the entry was deleted by checking the updated habit
    const habit = response.data.data!.habit;
    const deletedEntry = habit.entries.find(entry => entry.date === dateToDelete);
    
    if (deletedEntry) {
        throw new Error('entry was not deleted');
    }

    // Verify entries count decreased to 0
    if (habit.entries.length !== 0) {
        throw new Error(`expected 0 entries after deletion, found ${habit.entries.length}`);
    }
}