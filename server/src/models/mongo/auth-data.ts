import { Schema, model, Types } from 'mongoose';
import { AuthData } from "@timothyw/pat-common";

const authSchema = new Schema<AuthData>({
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
    timestamps: true
});

export const AuthDataModel = model<AuthData>('Auth', authSchema, 'auths');