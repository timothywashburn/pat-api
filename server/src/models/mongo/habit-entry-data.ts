import { Schema, model } from 'mongoose';
import { HabitEntryData } from "@timothyw/pat-common/dist/types/models/habit-data";

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
        enum: ['completed', 'excused']
    }
}, {
    timestamps: true,
});

habitEntrySchema.index({ habitId: 1, date: 1 }, { unique: true });

export const HabitEntryModel = model<HabitEntryData>('HabitEntry', habitEntrySchema);