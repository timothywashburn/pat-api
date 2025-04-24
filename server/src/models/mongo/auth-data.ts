import { Schema, model, Types } from 'mongoose';

export interface AuthData {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    email: string;
    passwordHash: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type PublicAuthData = Pick<AuthData, 'email' | 'emailVerified'>;

const authSchema = new Schema<AuthData>({
    userId: {
        type: Schema.Types.ObjectId,
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

export const AuthDataModel = model<AuthData>('Auth', authSchema);