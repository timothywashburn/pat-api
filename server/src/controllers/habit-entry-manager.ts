import { HabitEntryModel } from '../models/mongo/habit-entry-data';
import { HabitEntryData } from "@timothyw/pat-common/dist/types/models/habit-data";

export default class HabitEntryManager {
    private static instance: HabitEntryManager;

    private constructor() {}

    static getInstance(): HabitEntryManager {
        if (!HabitEntryManager.instance) {
            HabitEntryManager.instance = new HabitEntryManager();
        }
        return HabitEntryManager.instance;
    }

    async createOrUpdate(habitId: string, date: Date, status: 'completed' | 'excused' | 'missed'): Promise<HabitEntryData> {
        return HabitEntryModel.findOneAndUpdate(
            { habitId, date },
            { status },
            { new: true, upsert: true }
        );
    }

    async deleteByDate(habitId: string, date: string): Promise<boolean> {
        const result = await HabitEntryModel.findOneAndDelete({ habitId, date });
        return result !== null;
    }

    async getByHabitId(habitId: string): Promise<HabitEntryData[]> {
        return HabitEntryModel.find({ habitId }).sort({ date: 1 });
    }
}