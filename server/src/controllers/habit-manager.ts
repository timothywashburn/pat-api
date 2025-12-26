import { HabitModel } from '../models/mongo/habit-data';
import { HabitEntryModel } from '../models/mongo/habit-entry-data';
import {
    CreateHabitRequest, DateOnlyString,
    Habit,
    HabitData, HabitEntryData, HabitEntryStatus,
    HabitId,
    HabitStats,
    toHabit, UpdateHabitRequest, UserId
} from "@timothyw/pat-common";
import DateUtils from "../utils/date-utils";
import UserManager from "./user-manager";
import { AuthInfo } from "../api/types";
import { updateDocument } from "../utils/db-doc-utils";
import { TZDate } from "@date-fns/tz";

export default class HabitManager {
    private static instance: HabitManager;

    private constructor() {}

    static getInstance(): HabitManager {
        if (!HabitManager.instance) {
            HabitManager.instance = new HabitManager();
        }
        return HabitManager.instance;
    }

    async create(userId: UserId, data: CreateHabitRequest): Promise<HabitData> {
        const user = await UserManager.getInstance().getById(userId);
        if (!user) throw new Error('User not found');

        const highestSortOrder = await this.getHighestSortOrder(userId);
        const habit = new HabitModel({
            userId,
            ...data,
            firstDay: DateUtils.toLocalDateOnlyString(new Date(), user.timezone || 'America/Los_Angeles'),
            sortOrder: highestSortOrder + 1
        });

        const doc = await habit.save();
        return doc.toObject();
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
            const stats = await this.calculateStats(habit, entries);

            habits.push(toHabit(habit, entries, stats));
        }

        return habits;
    }

    async getByIdWithEntries(habitId: string): Promise<Habit | null> {
        const habit = await this.getById(habitId);
        if (!habit) return null;

        const entries = await HabitEntryModel.find({ habitId }).lean();
        const stats = await this.calculateStats(habit, entries);

        return toHabit(habit, entries, stats);
    }

    update(
        auth: AuthInfo,
        habitId: HabitId,
        updates: UpdateHabitRequest
    ): Promise<HabitData | null> {
        return updateDocument(auth, HabitModel, habitId, updates);
    }

    async delete(habitId: string, userId: string): Promise<boolean> {
        const habit = await HabitModel.findOneAndDelete({ _id: habitId, userId });
        if (habit) {
            await HabitEntryModel.deleteMany({ habitId });
            return true;
        }
        return false;
    }

    // TODO: make shared utils between frontend and backend
    async getCurrentActiveDate(habit: HabitData, timezone: string): Promise<DateOnlyString | null> {
        const checkDate = new Date();
        const user = await UserManager.getInstance().getById(habit.userId);

        const userStartOfDay = new TZDate(checkDate, user!.timezone);
        userStartOfDay.setHours(0, 0, 0, 0);
        userStartOfDay.setDate(userStartOfDay.getDate() - 1);

        for (let i = 0; i < 3; i++) {
            const habitStartTime = new Date(userStartOfDay.getTime() + habit.startOffsetMinutes * 60 * 1000);
            const habitEndTime = new Date(userStartOfDay.getTime() + habit.endOffsetMinutes * 60 * 1000);
            const dateOnlyString = userStartOfDay.toISOString().split('T')[0] as DateOnlyString;
            if (habitStartTime.getTime() < checkDate.getTime() && habitEndTime.getTime() > checkDate.getTime()) return dateOnlyString;
            userStartOfDay.setDate(userStartOfDay.getDate() + 1);
        }

        return null;
    }

    async getNextHabitEndTime(habit: HabitData, fromDate?: Date): Promise<Date> {
        const checkDate = fromDate || new Date();
        const user = await UserManager.getInstance().getById(habit.userId);

        const userStartOfDay = new TZDate(checkDate, user!.timezone);
        userStartOfDay.setHours(0, 0, 0, 0);
        userStartOfDay.setDate(userStartOfDay.getDate() - 1);

        for (let i = 0; i < 3; i++) {
            const habitEndTime = new Date(userStartOfDay.getTime() + habit.endOffsetMinutes * 60 * 1000);
            if (habitEndTime.getTime() > checkDate.getTime()) return habitEndTime;
            userStartOfDay.setDate(userStartOfDay.getDate() + 1);
        }

        throw new Error('could not find next habit end time');
    }

    private async calculateStats(habit: HabitData, entries: HabitEntryData[]): Promise<HabitStats> {
        const now = new Date();

        const user = await UserManager.getInstance().getById(habit.userId);
        const timezone = user!.timezone || 'America/Los_Angeles';

        const startOfFirstDay = new TZDate(habit.firstDay, user!.timezone);
        const startOfFirstHabit = new Date(startOfFirstDay.getTime() + habit.startOffsetMinutes * 60 * 1000);
        let totalDays = Math.ceil((now.getTime() - startOfFirstHabit.getTime()) / (1000 * 60 * 60 * 24));

        const currentActiveDate = await this.getCurrentActiveDate(habit, timezone);
        const todayEntry = currentActiveDate ? entries.find(e => e.date === currentActiveDate) : null;
        if (!todayEntry) totalDays--;

        const completedDays = entries.filter(e => e.status === HabitEntryStatus.COMPLETED).length;
        const excusedDays = entries.filter(e => e.status === HabitEntryStatus.EXCUSED).length;
        const explicitMissedDays = entries.filter(e => e.status === HabitEntryStatus.MISSED).length;

        const missedDays = totalDays - completedDays - excusedDays + explicitMissedDays;
        const completionRate = totalDays == 0 ? -1 : ((completedDays + excusedDays) / totalDays) * 100;

        return {
            totalDays,
            completedDays,
            excusedDays,
            missedDays,
            completionRate: Math.round(completionRate * 100) / 100
        };
    }

    async getHighestSortOrder(userId: UserId): Promise<number> {
        const highestHabit = await HabitModel.findOne({ userId }).sort({ sortOrder: -1 }).lean();
        return highestHabit ? highestHabit.sortOrder : 0;
    }
}