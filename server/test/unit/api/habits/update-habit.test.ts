import { TestContext } from '../../../main';
import { UpdateHabitRequest, UpdateHabitResponse } from "@timothyw/pat-common";
import { HabitModel } from '../../../../src/models/mongo/habit-data';
import { put } from "../../../test-utils";

export async function runUpdateHabitTest(context: TestContext) {
    if (!context.authToken || !context.habitIds || context.habitIds.length === 0) {
        throw new Error('missing required context for update habit test');
    }

    const data = {
        name: 'First Habit',
        description: 'First Item\nSecond Item\nThird Item\nFourth Item',
        rolloverTime: '23:00'

    };

    const updateResponse = await put<UpdateHabitRequest, UpdateHabitResponse>(
        context,
        `/api/habits/${context.habitIds[0]}`,
        data
    );

    if (!updateResponse.success) throw new Error('failed to update habit');
    if (updateResponse.habit.name !== data.name) throw new Error('name not updated in response');
    if (updateResponse.habit.description !== data.description) throw new Error('description not updated in response');

    const habit = await HabitModel.findById(context.habitIds[0]);
    if (!habit) throw new Error('habit not found in database');
    if (habit.name !== data.name) throw new Error('name not updated in database');
    if (habit.description !== data.description) throw new Error('description not updated in database');
}
