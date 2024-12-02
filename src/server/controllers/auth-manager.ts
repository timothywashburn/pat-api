import { Types } from "mongoose";
import { UserConfig } from "../models/mongo/user-config";
import { sign, verify } from "jsonwebtoken";
import UserManager from "./user-manager";
import { AuthData, AuthDataModel } from "../models/mongo/auth-data";
import { compare, hash } from "bcrypt";
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret';

interface TokenPayload {
    authId: string;
    userId: string;
    emailVerified: boolean;
}

interface RefreshTokenPayload extends TokenPayload {
    tokenId: string;
}

export default class AuthManager {
    private static instance: AuthManager;

    private constructor() {}

    private generateTokens(auth: AuthData, userId: Types.ObjectId): { token: string; refreshToken: string } {
        const tokenId = randomBytes(32).toString('hex');

        const tokenPayload: TokenPayload = {
            authId: auth._id.toString(),
            userId: userId.toString(),
            emailVerified: auth.emailVerified
        };

        const refreshPayload: RefreshTokenPayload = {
            ...tokenPayload,
            tokenId
        };

        return {
            token: sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' }),
            refreshToken: sign(refreshPayload, REFRESH_SECRET, { expiresIn: '7d' })
        };
    }

    async register(name: string, email: string, password: string): Promise<{ user: UserConfig; auth: AuthData; token: string; refreshToken: string }> {
        const existingAuth = await AuthDataModel.findOne({ email });
        if (existingAuth) {
            throw new Error('Email already exists');
        }

        const user = await UserManager.getInstance().create(name);
        const passwordHash = await hash(password, 10);
        const auth = await new AuthDataModel({
            userId: user._id,
            email,
            passwordHash,
            emailVerified: false
        }).save();

        const { token, refreshToken } = this.generateTokens(auth, user._id);
        return { user, auth, token, refreshToken };
    }

    async login(email: string, password: string): Promise<{ user: UserConfig; token: string; refreshToken: string, emailVerified: boolean } | null> {
        const auth = await AuthDataModel.findOne({ email });
        if (!auth) return null;
        let emailVerified = auth.emailVerified;

        const isValid = await compare(password, auth.passwordHash);
        if (!isValid) return null;

        const user = await UserManager.getInstance().getById(auth.userId);
        if (!user) return null;

        const { token, refreshToken } = this.generateTokens(auth, user._id);
        return { user, token, refreshToken, emailVerified };
    }

    async refreshToken(refreshToken: string): Promise<{ user: UserConfig; auth: AuthData; token: string; refreshToken: string } | null> {
        try {
            const decoded = verify(refreshToken, REFRESH_SECRET) as RefreshTokenPayload;
            const auth = await AuthDataModel.findById(decoded.authId);
            if (!auth) return null;

            const user = await UserManager.getInstance().getById(auth.userId);
            if (!user) return null;

            const tokens = this.generateTokens(auth, user._id);
            return { user, auth, ...tokens };
        } catch {
            return null;
        }
    }

    verifyToken(token: string): { authId: Types.ObjectId; userId: Types.ObjectId; emailVerified: boolean } | null {
        try {
            const decoded = verify(token, JWT_SECRET) as TokenPayload;
            return {
                authId: new Types.ObjectId(decoded.authId),
                userId: new Types.ObjectId(decoded.userId),
                emailVerified: decoded.emailVerified
            };
        } catch {
            return null;
        }
    }

    async verifyEmail(authId: Types.ObjectId): Promise<boolean> {
        const result = await AuthDataModel.findByIdAndUpdate(
            authId,
            { $set: { emailVerified: true } },
            { new: true }
        );
        return result !== null;
    }

    static getInstance(): AuthManager {
        if (!AuthManager.instance) AuthManager.instance = new AuthManager();
        return AuthManager.instance;
    }
}