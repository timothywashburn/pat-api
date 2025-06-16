import axios from 'axios';
import { TestContext } from '../../../main';
import { HabitModel } from "../../../../src/models/mongo/habit-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { CreateHabitResponse } from "@timothyw/pat-common";

export async function runCreateHabitsTest(context: TestContext) {
    await createHabit(context, {
        name: 'Drink Water',
        description: 'Drink 8 glasses of water daily',
        frequency: 'daily',
        rolloverTime: '06:00'
    });

    await createHabit(context, {
        name: 'Exercise',
        frequency: 'daily',
        rolloverTime: '05:30'
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
    const response = await axios.post<ApiResponseBody<CreateHabitResponse>>(
        `${context.baseUrl}/api/habits`,
        data,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error(`failed to create habit: ${data.name}`);
    context.habitIds.push(response.data.data!.habit._id);
}