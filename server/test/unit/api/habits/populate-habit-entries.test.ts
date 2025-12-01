import { TestContext } from '../../../main';
import { HabitModel } from "../../../../src/models/mongo/habit-data";
import { HabitEntryModel } from "../../../../src/models/mongo/habit-entry-data";
import { HabitEntryStatus } from "@timothyw/pat-common";

function seededRandom(seed: number) {
    let state = seed;
    return function() {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
    };
}

function getDateString(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
}

const daysToPopulate = 15;

export async function runPopulateHabitEntriesTest(context: TestContext) {
    const past = getDateString(daysToPopulate);
    const random = seededRandom(0);

    await HabitModel.updateMany(
        { userId: context.userId },
        { $set: { firstDay: past } }
    );

    for (const habitId of context.habitIds) {
        for (let daysAgo = daysToPopulate; daysAgo >= 1; daysAgo--) {
            const dateString = getDateString(daysAgo);

            const existingEntry = await HabitEntryModel.findOne({ habitId, date: dateString });
            if (existingEntry) continue;

            if (random() < 0.5) {
                const randVal = random();
                let status: HabitEntryStatus;
                if (randVal < 0.7) {
                    status = HabitEntryStatus.COMPLETED;
                } else if (randVal < 0.85) {
                    status = HabitEntryStatus.EXCUSED;
                } else {
                    status = HabitEntryStatus.MISSED;
                }

                await HabitEntryModel.create({
                    habitId,
                    date: dateString,
                    status
                });
            }
        }
    }
}
