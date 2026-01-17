import { Schema, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { HabitData, HabitFrequency } from "@timothyw/pat-common";

const habitSchema = new Schema<HabitData>({
    _id: {
        type: String,
        required: true,
        default: uuidv4
    },
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
    startOffsetMinutes: {
        type: Number,
        required: true,
    },
    endOffsetMinutes: {
        type: Number,
        required: true,
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
    },
    sortOrder: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
});

export const HabitModel = model<HabitData>('Habit', habitSchema, 'habits');