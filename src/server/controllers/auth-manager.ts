import { compare, hash } from 'bcrypt';
import { AuthData, AuthDataModel } from "../models/auth-data";
import { Types } from "mongoose";
import { verify, sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

    async login(email: string, password: string): Promise<{ auth: AuthData; token: string } | null> {
        const auth = await AuthDataModel.findOne({ email });
        if (!auth) return null;

        const isValid = await compare(password, auth.passwordHash);
        if (!isValid) return null;

        const token = sign(
            { userId: auth._id.toString() },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { auth, token };
    }

    verifyToken(token: string): { userId: Types.ObjectId } | null {
        try {
            const decoded = verify(token, JWT_SECRET) as { userId: string };
            return { userId: new Types.ObjectId(decoded.userId) };
        } catch {
            return null;
        }
    }

    getById(id: Types.ObjectId): Promise<AuthData | null> {
        return AuthDataModel.findById(id);
    }

    getByEmail(email: string): Promise<AuthData | null> {
        return AuthDataModel.findOne({ email });
    }

    async changePassword(email: string, oldPassword: string, newPassword: string): Promise<boolean> {
        const authResult = await this.login(email, oldPassword);
        if (!authResult) return false;

        const passwordHash = await hash(newPassword, 10);
        await AuthDataModel.updateOne({ email }, { passwordHash });

        return true;
    }

    static getInstance(): AuthManager {
        if (!AuthManager.instance) AuthManager.instance = new AuthManager();
        return AuthManager.instance;
    }
}