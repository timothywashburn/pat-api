import { Schema, model, Types } from 'mongoose';

interface AuthData {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}

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
    }
}, {
    timestamps: true
});

const AuthDataModel = model<AuthData>('Auth', authSchema);

export {
    AuthData,
    AuthDataModel
};