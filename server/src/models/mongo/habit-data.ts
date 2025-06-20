import { Schema, model } from 'mongoose';
import { HabitData, HabitFrequency } from "@timothyw/pat-common/dist/types/models/habit-data";

const habitSchema = new Schema<HabitData>({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    notes: {
        type: String,
        trim: true,
    },
    frequency: {
        type: String,
        required: true,
        enum: Object.values(HabitFrequency),
        default: HabitFrequency.DAILY
    },
    rolloverTime: {
        type: String,
        required: true,
        validate: {
            validator: function(v: string) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'rolloverTime must be in HH:MM format'
        }
    },
    firstDay: {
        type: String,
        required: true,
        validate: {
            validator: function(v: string) {
                return /^\d{4}-\d{2}-\d{2}$/.test(v);
            },
            message: 'firstDay must be in YYYY-MM-DD format'
        }
    }
}, {
    timestamps: true,
});

export const HabitModel = model<HabitData>('Habit', habitSchema, 'habits');