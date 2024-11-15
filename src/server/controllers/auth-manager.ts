import {Types} from "mongoose";
import {UserConfig} from "../models/user-config";
import {sign, verify} from "jsonwebtoken";
import UserManager from "./user-manager";
import {AuthData, AuthDataModel} from "../models/auth-data";
import {compare, hash} from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface TokenPayload {
    userId: string;
}

export default class AuthManager {
    private static instance: AuthManager;

    private constructor() {}

    async register(name: string, email: string, password: string): Promise<{ user: UserConfig, auth: AuthData }> {
        const existingAuth = await AuthDataModel.findOne({ email });
        if (existingAuth) {
            throw new Error('Email already exists');
        }

        const user = await UserManager.getInstance().create(name);

        const passwordHash = await hash(password, 10);
        const auth = await new AuthDataModel({
            userId: user._id,
            email,
            passwordHash
        }).save();

        return { user, auth };
    }

    async login(email: string, password: string): Promise<{ user: UserConfig; token: string } | null> {
        const auth = await AuthDataModel.findOne({ email });
        if (!auth) return null;

        const isValid = await compare(password, auth.passwordHash);
        if (!isValid) return null;

        const user = await UserManager.getInstance().getById(auth.userId);
        if (!user) return null;

        const tokenPayload: TokenPayload = {
            userId: auth._id.toString()
        };

        const token = sign(
            tokenPayload,
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { user, token };
    }

    verifyToken(token: string): { userId: Types.ObjectId } | null {
        try {
            const decoded = verify(token, JWT_SECRET) as { userId: string };
            return { userId: new Types.ObjectId(decoded.userId) };
        } catch {
            return null;
        }
    }

    static getInstance(): AuthManager {
        if (!AuthManager.instance) AuthManager.instance = new AuthManager();
        return AuthManager.instance;
    }
}