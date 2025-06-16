import axios from 'axios';
import { TestContext } from '../../../main';
import { HabitModel } from "../../../../src/models/mongo/habit-data";
import { HabitEntryModel } from "../../../../src/models/mongo/habit-entry-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { DeleteHabitResponse } from "@timothyw/pat-common";

export async function runDeleteHabitTest(context: TestContext) {
    if (context.habitIds.length === 0) {
        throw new Error('no habits available to delete');
    }

    // Get the last habit to delete (so we don't interfere with other tests)
    const habitToDelete = context.habitIds[context.habitIds.length - 1];
    
    // Verify the habit exists before deletion
    const habitBefore = await HabitModel.findById(habitToDelete);
    if (!habitBefore) {
        throw new Error('habit to delete not found in database');
    }

    // Delete the habit
    const response = await axios.delete<ApiResponseBody<DeleteHabitResponse>>(
        `${context.baseUrl}/api/habits/${habitToDelete}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to delete habit');

    // Verify the habit was deleted from the database
    const habitAfter = await HabitModel.findById(habitToDelete);
    if (habitAfter) {
        throw new Error('habit was not deleted from database');
    }

    // Verify all associated entries were deleted (cascade delete)
    const remainingEntries = await HabitEntryModel.find({ habitId: habitToDelete });
    if (remainingEntries.length > 0) {
        throw new Error('habit entries were not cascade deleted');
    }

    // Remove from context for future tests
    context.habitIds = context.habitIds.filter(id => id !== habitToDelete);

    // Verify the correct number of habits remain
    const remainingHabits = await HabitModel.find({ userId: context.userId });
    if (remainingHabits.length !== context.habitIds.length) {
        throw new Error(`expected ${context.habitIds.length} habits remaining, found ${remainingHabits.length}`);
    }
}