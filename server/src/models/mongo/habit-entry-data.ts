import { Schema, model } from 'mongoose';
import { HabitEntryData, HabitEntryStatus } from "@timothyw/pat-common/dist/types/models/habit-data";
import { v4 as uuidv4 } from 'uuid';

const habitEntrySchema = new Schema<HabitEntryData>({
    _id: {
        type: String,
        required: true,
        default: uuidv4
    },
    habitId: {
        type: String,
        required: true,
        ref: 'Habit'
    },
    date: {
        type: String,
        required: true,
        validate: {
            validator: function(v: string) {
                return /^\d{4}-\d{2}-\d{2}$/.test(v);
            },
            message: 'date must be in YYYY-MM-DD format'
        }
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

export const HabitEntryModel = model<HabitEntryData>('HabitEntry', habitEntrySchema, 'habit_entries');