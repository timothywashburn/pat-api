import { Schema, model, Types } from 'mongoose';

interface AuthData {
    _id: Types.ObjectId;

    name: string;
    email: string;
    passwordHash: string;

    createdAt: Date;
    updatedAt: Date;
}

const authSchema = new Schema<AuthData>({
    name: {
        type: String,
        required: true,
        trim: true
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