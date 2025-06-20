import { HabitModel } from '../models/mongo/habit-data';
import { HabitEntryModel } from '../models/mongo/habit-entry-data';
import {
    CreateHabitRequest,
    Habit,
    HabitData,
    HabitId,
    HabitStats,
    ItemData,
    ItemId,
    toDateString,
    toHabit, UpdateHabitRequest, UpdateItemRequest, UpdateItemResponse,
    UserId
} from "@timothyw/pat-common";
import { HabitEntryData } from "@timothyw/pat-common/dist/types/models/habit-data";
import DateUtils from "../utils/date-utils";
import UserManager from "./user-manager";
import { isBefore } from "date-fns";
import { ItemModel } from "../models/mongo/item-data";
import { AuthInfo } from "../api/types";
import { updateDocument } from "../utils/db-doc-utils";

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
        const habit = new HabitModel({
            userId,
            ...data,
            firstDay: DateUtils.toLocalDateOnlyString(new Date(), user.timezone || 'America/Los_Angeles'),
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

    // update(
    //     auth: AuthInfo,
    //     habitId: HabitId,
    //     updates: Partial<Pick<HabitData, 'name' | 'description' | 'notes' | 'frequency' | 'rolloverTime'>>
    // ): Promise<HabitData | null> {
    //
    //     const set: any = {};
    //     const unset: any = {};
    //
    //     Object.entries(updates).forEach(([key, value]) => {
    //         if (value === null) {
    //             unset[key] = "";
    //         } else {
    //             set[key] = value;
    //         }
    //     });
    //
    //     const updateOperation: any = {};
    //     if (Object.keys(set).length > 0) updateOperation.$set = set;
    //     if (Object.keys(unset).length > 0) updateOperation.$unset = unset;
    //
    //     return HabitModel.findOneAndUpdate(
    //         { _id: habitId, userId: auth.userId },
    //         updateOperation,
    //         { new: true }
    //     );
    // }

    async delete(habitId: string, userId: string): Promise<boolean> {
        const habit = await HabitModel.findOneAndDelete({ _id: habitId, userId });
        if (habit) {
            await HabitEntryModel.deleteMany({ habitId });
            return true;
        }
        return false;
    }

    private async calculateStats(habit: HabitData, entries: HabitEntryData[]): Promise<HabitStats> {
        const now = new Date();

        const user = await UserManager.getInstance().getById(habit.userId as UserId); // todo: fix
        const timezone = user?.timezone || 'America/Los_Angeles';
        const hours = Number(habit.rolloverTime.split(':')[0]);
        const minutes = Number(habit.rolloverTime.split(':')[1]);

        const firstDayTime = DateUtils.dateInTimezoneAsUTC(habit.firstDay, hours, minutes, 0, timezone);
        let totalDays = Math.ceil((now.getTime() - firstDayTime.getTime()) / (1000 * 60 * 60 * 24));

        const todayDateOnlyString = DateUtils.toLocalDateOnlyString(new Date(), timezone);
        const yesterdayDateOnlyString = DateUtils.toLocalDateOnlyString(new Date(new Date().getTime() - 24 * 60 * 60 * 1000), timezone);
        const rolloverDate = DateUtils.dateInTimezoneAsUTC(todayDateOnlyString, hours, minutes, 0, timezone);
        const currentDateOnlyString = isBefore(new Date(), rolloverDate) ? yesterdayDateOnlyString : todayDateOnlyString;
        const todayEntry = entries.find(e => e.date === currentDateOnlyString);
        if (!todayEntry) totalDays--;

        const completedDays = entries.filter(e => e.status === 'completed').length;
        const excusedDays = entries.filter(e => e.status === 'excused').length;

        const missedDays = totalDays - completedDays - excusedDays;
        const completionRate = totalDays == 0 ? -1 : ((completedDays + excusedDays) / totalDays) * 100;

        return {
            totalDays,
            completedDays,
            excusedDays,
            missedDays,
            completionRate: Math.round(completionRate * 100) / 100
        };
    }
}