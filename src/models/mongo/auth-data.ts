import { Schema, model, Types } from 'mongoose';
import { AuthData } from "@timothyw/pat-common";
import { v4 as uuidv4 } from 'uuid';

const authSchema = new Schema({
    _id: {
        type: String,
        required: true,
        default: uuidv4
    },
    userId: {
        type: String,
        ref: 'UserConfig',
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

export const AuthDataModel = model<AuthData>('Auth', authSchema, 'auths');