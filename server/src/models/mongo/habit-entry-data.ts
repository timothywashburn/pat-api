import { Schema, model } from 'mongoose';
import { HabitEntryData, HabitEntryStatus } from "@timothyw/pat-common/dist/types/models/habit-data";

const habitEntrySchema = new Schema<HabitEntryData>({
    habitId: {
        type: String,
        required: true,
        ref: 'Habit'
    },
    date: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: Object.values(HabitEntryStatus)
    }
}, {
    timestamps: true,
});

habitEntrySchema.index({ habitId: 1, date: 1 }, { unique: true });

export const HabitEntryModel = model<HabitEntryData>('HabitEntry', habitEntrySchema);