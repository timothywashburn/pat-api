import { TestContext } from '../../../main';
import { HabitModel } from "../../../../src/models/mongo/habit-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { CreateHabitResponse, Habit, Serializer } from "@timothyw/pat-common";
import { post } from "../../../test-utils";

export async function runCreateHabitsTest(context: TestContext) {
    await createHabit(context, {
        name: 'To Update',
        description: 'This should get updated',
        frequency: 'daily',
        rolloverTime: '00:00'
    });

    await createHabit(context, {
        name: 'Exercise',
        frequency: 'daily',
        rolloverTime: '06:00'
    });

    await createHabit(context, {
        name: 'Read Books',
        description: 'Read for at least 30 minutes',
        frequency: 'daily',
        rolloverTime: '22:00'
    });

    const habits = await HabitModel.find({
        userId: context.userId
    });

    if (habits.length !== context.habitIds.length)
        throw new Error(`expected ${context.habitIds.length} habit${context.habitIds.length === 1 ? "" : "s"}, found ${habits.length}`);
}

async function createHabit(context: TestContext, data: Record<string, any>) {
    const response = await post<Record<string, any>, CreateHabitResponse>(
        context,
        "/api/habits",
        data
    );

    if (!response.success) throw new Error(`failed to create habit: ${data.name}`);
    const habit = Serializer.deserialize<Habit>(response.habit);
    context.habitIds.push(habit._id);
}