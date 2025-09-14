import { TestContext } from '../../../main';
import { HabitModel } from "../../../../src/models/mongo/habit-data";
import { CreateHabitRequest, CreateHabitResponse, Habit, HabitFrequency, Serializer } from "@timothyw/pat-common";
import { post } from "../../../test-utils";

export async function runCreateHabitsTest(context: TestContext) {
    await createHabit(context, {
        name: 'To Update',
        description: 'This should get updated',
        frequency: HabitFrequency.DAILY,
        startOffsetMinutes: 0,
        endOffsetMinutes: 60 * 24
    });

    await createHabit(context, {
        name: 'Exercise',
        frequency: HabitFrequency.DAILY,
        startOffsetMinutes: 0,
        endOffsetMinutes: 60 * 24
    });

    await createHabit(context, {
        name: 'Read Books',
        description: 'Read for at least 30 minutes',
        frequency: HabitFrequency.DAILY,
        startOffsetMinutes: 0,
        endOffsetMinutes: 60 * 24
    });

    const habits = await HabitModel.find({
        userId: context.userId
    });

    if (habits.length !== context.habitIds.length)
        throw new Error(`expected ${context.habitIds.length} habit${context.habitIds.length === 1 ? "" : "s"}, found ${habits.length}`);
}

async function createHabit(context: TestContext, data: CreateHabitRequest) {
    const response = await post<CreateHabitRequest, CreateHabitResponse>(
        context,
        "/api/habits",
        data
    );

    if (!response.success) throw new Error(`failed to create habit: ${data.name}`);
    const habit = Serializer.deserialize<Habit>(response.habit);
    context.habitIds.push(habit._id);
}