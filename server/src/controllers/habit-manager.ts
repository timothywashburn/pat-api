import { HabitModel } from '../models/mongo/habit-data';
import { HabitEntryModel } from '../models/mongo/habit-entry-data';
import { Habit, HabitData, HabitStats, toDateString, toHabit } from "@timothyw/pat-common";
import { HabitEntryData } from "@timothyw/pat-common/dist/types/models/habit-data";

export default class HabitManager {
    private static instance: HabitManager;

    private constructor() {}

    static getInstance(): HabitManager {
        if (!HabitManager.instance) {
            HabitManager.instance = new HabitManager();
        }
        return HabitManager.instance;
    }

    async create(userId: string, data: {
        name: string;
        description?: string;
        frequency: 'daily';
        rolloverTime: string;
    }): Promise<HabitData> {
        const habit = new HabitModel({
            userId,
            ...data
        });
        return habit.save();
    }

    async getById(habitId: string): Promise<HabitData | null> {
        return HabitModel.findById(habitId).lean();
    }

    async getAllByUser(userId: string): Promise<HabitData[]> {
        return HabitModel.find({ userId }).lean();
    }

    async getAllByUserWithEntries(userId: string): Promise<Habit[]> {
        const habitDataList = await this.getAllByUser(userId);
        const habits: Habit[] = [];

        for (const habit of habitDataList) {
            const entries = await HabitEntryModel.find({ habitId: habit._id.toString() }).lean();
            const stats = this.calculateStats(habit, entries);

            habits.push(toHabit(habit, entries, stats));
        }

        return habits;
    }

    async getByIdWithEntries(habitId: string): Promise<Habit | null> {
        const habit = await this.getById(habitId);
        if (!habit) return null;

        const entries = await HabitEntryModel.find({ habitId }).lean();
        const stats = this.calculateStats(habit, entries);

        return toHabit(habit, entries, stats);
    }

    async update(habitId: string, userId: string, data: Partial<{
        name: string;
        description?: string;
        frequency: 'daily';
        rolloverTime: string;
    }>): Promise<HabitData | null> {
        return HabitModel.findOneAndUpdate(
            { _id: habitId, userId },
            data,
            { new: true }
        );
    }

    async delete(habitId: string, userId: string): Promise<boolean> {
        const habit = await HabitModel.findOneAndDelete({ _id: habitId, userId });
        if (habit) {
            await HabitEntryModel.deleteMany({ habitId });
            return true;
        }
        return false;
    }

    private calculateStats(habit: HabitData, entries: HabitEntryData[]): HabitStats {
        const now = new Date();
        const habitCreated = new Date(habit.createdAt);
        
        const daysDiff = Math.floor((now.getTime() - habitCreated.getTime()) / (1000 * 60 * 60 * 24));
        const totalDays = Math.max(1, daysDiff + 1);

        const completedDays = entries.filter(e => e.status === 'completed').length;
        const excusedDays = entries.filter(e => e.status === 'excused').length;
        const missedDays = totalDays - completedDays - excusedDays;

        const completionRate = ((completedDays + excusedDays) / totalDays) * 100;

        return {
            totalDays,
            completedDays,
            excusedDays,
            missedDays,
            completionRate: Math.round(completionRate * 100) / 100
        };
    }
}