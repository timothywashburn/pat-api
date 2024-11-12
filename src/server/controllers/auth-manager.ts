import { compare, hash } from 'bcrypt';
import { AuthData, AuthDataModel } from "../models/auth-data";
import { Types } from "mongoose";

export default class AuthManager {
    private static instance: AuthManager;

    private constructor() {}

    async register(name: string, email: string, password: string): Promise<AuthData> {
        const existingUser = await AuthDataModel.findOne({ email });
        if (existingUser) {
            throw new Error('Email already exists');
        }

        const passwordHash = await hash(password, 10);

        const auth = new AuthDataModel({
            name,
            email,
            passwordHash
        });

        return auth.save();
    }

    async login(email: string, password: string): Promise<AuthData | null> {
        const auth = await AuthDataModel.findOne({ email });
        if (!auth) return null;

        const isValid = await compare(password, auth.passwordHash);
        if (!isValid) return null;

        return auth;
    }

    getById(id: Types.ObjectId): Promise<AuthData | null> {
        return AuthDataModel.findById(id);
    }

    getByEmail(email: string): Promise<AuthData | null> {
        return AuthDataModel.findOne({ email });
    }

    async changePassword(email: string, oldPassword: string, newPassword: string): Promise<boolean> {
        const auth = await this.login(email, oldPassword);
        if (!auth) return false;

        const passwordHash = await hash(newPassword, 10);
        await AuthDataModel.updateOne({ email }, { passwordHash });

        return true;
    }

    static getInstance(): AuthManager {
        if (!AuthManager.instance) AuthManager.instance = new AuthManager();
        return AuthManager.instance;
    }
}