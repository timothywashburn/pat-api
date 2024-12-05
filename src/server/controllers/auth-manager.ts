import { Types } from "mongoose";
import { UserConfig } from "../models/mongo/user-config";
import { sign, verify } from "jsonwebtoken";
import UserManager from "./user-manager";
import { AuthData, AuthDataModel } from "../models/mongo/auth-data";
import { compare, hash } from "bcrypt";
import { randomBytes } from 'crypto';
import MailjetManager from "./mailjet-manager";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret';

export interface TokenPayload {
    authId: string;
    userId: string;
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
            userId: userId.toString()
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

    async login(email: string, password: string): Promise<{ userConfig: UserConfig; token: string; refreshToken: string, emailVerified: boolean } | null> {
        const authData = await AuthDataModel.findOne({ email });
        if (!authData) return null;

        const isValid = await compare(password, authData.passwordHash);
        if (!isValid) return null;

        const userConfig = await UserManager.getInstance().getById(authData.userId);
        if (!userConfig) return null;

        const { token, refreshToken } = this.generateTokens(authData, userConfig._id);
        return { userConfig, token, refreshToken, emailVerified: authData.emailVerified };
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

    verifyToken(token: string): { authId: Types.ObjectId; userId: Types.ObjectId } | null {
        try {
            const decoded = verify(token, JWT_SECRET) as TokenPayload;
            return {
                authId: new Types.ObjectId(decoded.authId),
                userId: new Types.ObjectId(decoded.userId)
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

    async resendVerificationEmail(authId: Types.ObjectId): Promise<boolean> {
        try {
            console.log('[email-verification] looking up auth data');
            const auth = await AuthDataModel.findById(authId);
            if (!auth || auth.emailVerified) {
                return false;
            }

            console.log('[email-verification] found auth; sending verification email');
            return await MailjetManager.getInstance().sendVerificationEmail(auth);
        } catch (error) {
            console.error('failed to resend verification email:', error);
            return false;
        }
    }

    static getInstance(): AuthManager {
        if (!AuthManager.instance) AuthManager.instance = new AuthManager();
        return AuthManager.instance;
    }
}