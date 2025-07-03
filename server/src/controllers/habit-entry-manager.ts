import { HabitEntryModel } from '../models/mongo/habit-entry-data';
import { HabitEntryData, HabitEntryStatus } from "@timothyw/pat-common/dist/types/models/habit-data";
import { DateOnlyString } from "@timothyw/pat-common";

export default class HabitEntryManager {
    private static instance: HabitEntryManager;

    private constructor() {}

    static getInstance(): HabitEntryManager {
        if (!HabitEntryManager.instance) {
            HabitEntryManager.instance = new HabitEntryManager();
        }
        return HabitEntryManager.instance;
    }

    async createOrUpdate(habitId: string, date: DateOnlyString, status: HabitEntryStatus): Promise<HabitEntryData> {
        return HabitEntryModel.findOneAndUpdate(
            { habitId, date },
            { status },
            { new: true, upsert: true }
        ).lean();
    }

    async deleteByDate(habitId: string, dateString: DateOnlyString): Promise<boolean> {
        const result = await HabitEntryModel.findOneAndDelete({ habitId, date: dateString });
        return result !== null;
    }

    async getByHabitId(habitId: string): Promise<HabitEntryData[]> {
        return HabitEntryModel.find({ habitId }).sort({ date: 1 }).lean();
    }
}