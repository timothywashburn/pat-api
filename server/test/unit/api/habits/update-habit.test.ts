import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { UpdateHabitResponse } from "../../../../src/api/endpoints/habits/update-habit";

export async function runUpdateHabitTest(context: TestContext) {
    if (context.habitIds.length === 0) {
        throw new Error('no habits available to update');
    }

    const habitId = context.habitIds[0];
    
    const response = await axios.put<ApiResponseBody<UpdateHabitResponse>>(
        `${context.baseUrl}/api/habits/${habitId}`,
        {
            name: 'Updated Drink Water',
            description: 'Drink 10 glasses of water daily',
            rolloverTime: '07:00'
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to update habit');
    
    const updatedHabit = response.data.data!.habit;
    if (updatedHabit.name !== 'Updated Drink Water') {
        throw new Error('habit name was not updated');
    }
    if (updatedHabit.description !== 'Drink 10 glasses of water daily') {
        throw new Error('habit description was not updated');
    }
    if (updatedHabit.rolloverTime !== '07:00') {
        throw new Error('habit rolloverTime was not updated');
    }
}