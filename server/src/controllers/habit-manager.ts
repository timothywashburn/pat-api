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
import { addDays, isBefore, startOfDay } from "date-fns";
import { AuthInfo } from "../api/types";
import { updateDocument } from "../utils/db-doc-utils";
import { toZonedTime } from "date-fns-tz";
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
        const habit = new HabitModel({
            userId,
            ...data,
            firstDay: DateUtils.toLocalDateOnlyString(new Date(), user.timezone || 'America/Los_Angeles'),
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
        const now = new Date();
        const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        let date = new Date(yesterdayDate);
        date.setHours(0, 0, 0, 0);

        for (let i = 0; i < 2; i++) {
            const habitStart = new Date(date.getTime() + habit.startOffsetMinutes * 60 * 1000);
            const habitEnd = new Date(date.getTime() + habit.endOffsetMinutes * 60 * 1000);

            if (now.getTime() >= habitStart.getTime() && now.getTime() <= habitEnd.getTime()) {
                return DateUtils.toLocalDateOnlyString(date, timezone);
            }
            date.setDate(date.getDate() + 1);
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
            // Calculate habit end time in user's timezone
            const userHabitEnd = new TZDate(
                userStartOfDay.getTime() + habit.endOffsetMinutes * 60 * 1000,
                user!.timezone
            );

            console.log(`day ${i}: user habit end: ${userHabitEnd.toString()}`);

            const utcHabitEnd = new Date(userHabitEnd.getTime());

            if (utcHabitEnd.getTime() > checkDate.getTime()) {
                console.log(`found next habit end time: ${utcHabitEnd.toISOString()}`);
                return utcHabitEnd;
            }

            userStartOfDay.setDate(userStartOfDay.getDate() + 1);
        }

        throw new Error('could not find next habit end time');
    }

    private async calculateStats(habit: HabitData, entries: HabitEntryData[]): Promise<HabitStats> {
        const now = new Date();

        const user = await UserManager.getInstance().getById(habit.userId);
        const timezone = user?.timezone || 'America/Los_Angeles';

        const firstDayTime = DateUtils.dateInTimezoneAsUTC(habit.firstDay, 0, habit.startOffsetMinutes, 0, timezone);
        let totalDays = Math.ceil((now.getTime() - firstDayTime.getTime()) / (1000 * 60 * 60 * 24));

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
}