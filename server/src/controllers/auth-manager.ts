import { Types } from "mongoose";
import { sign, verify } from "jsonwebtoken";
import UserManager from "./user-manager";
import { compare, hash } from "bcrypt";
import { randomBytes } from 'crypto';
import MailjetManager from "./mailjet-manager";
import {
    AuthData, AuthId,
    AuthTokens,
    LoginResponse, RefreshAuthResponse,
    RefreshTokenPayload,
    TokenPayload,
    toPublicAuthData, UserConfig, UserId
} from "@timothyw/pat-common";
import { AuthDataModel } from "../models/mongo/auth-data";

export default class AuthManager {
    private static instance: AuthManager;

    private constructor() {}

    private generateTokens(auth: AuthData, userId: UserId): AuthTokens {
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
            accessToken: sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: '1d' }),
            refreshToken: sign(refreshPayload, process.env.REFRESH_SECRET!, { expiresIn: '7d' })
        };
    }

    async register(name: string, email: string, password: string): Promise<{ tokenData: AuthTokens; authData: AuthData; user: UserConfig }> {
        const existingAuth = await AuthDataModel.findOne({ email });
        if (existingAuth) {
            throw new Error('Email already exists');
        }

        const user = await UserManager.getInstance().create(name);
        const passwordHash = await hash(password, 10);
        const authData = await new AuthDataModel({
            userId: user._id,
            email,
            passwordHash,
            emailVerified: false
        }).save();

        const tokenData = this.generateTokens(authData, user._id);
        return {
            authData,
            tokenData,
            user
        };
    }

    async login(email: string, password: string): Promise<LoginResponse | null> {
        const authData: AuthData | null = await AuthDataModel.findOne({ email });
        if (!authData) return null;

        const isValid = await compare(password, authData.passwordHash);
        if (!isValid) return null;

        const user = await UserManager.getInstance().getById(authData.userId);
        if (!user) return null;

        const tokenData = this.generateTokens(authData, user._id);
        return {
            tokenData,
            authData: toPublicAuthData(authData),
            user
        };
    }

    async refreshAuth(refreshToken: string): Promise<RefreshAuthResponse | null> {
        try {
            const decoded = verify(refreshToken, process.env.REFRESH_SECRET!) as RefreshTokenPayload;
            const authData = await AuthDataModel.findById(decoded.authId);
            if (!authData) return null;

            const user = await UserManager.getInstance().getById(authData.userId);
            if (!user) return null;

            const tokenData = this.generateTokens(authData, user._id);

            return {
                tokenData,
                authData: toPublicAuthData(authData),
            };
        } catch {
            return null;
        }
    }

    verifyToken(token: string): { authId: AuthId; userId: UserId } | null {
        try {
            const decoded = verify(token, process.env.JWT_SECRET!) as TokenPayload;
            return {
                authId: decoded.authId as AuthId,
                userId: decoded.userId as UserId
            };
        } catch {
            return null;
        }
    }

    async verifyEmail(authId: AuthId): Promise<boolean> {
        const result = await AuthDataModel.findByIdAndUpdate(
            authId,
            { $set: { emailVerified: true } },
            { new: true }
        );
        return result !== null;
    }

    async resendVerificationEmail(authId: AuthId): Promise<boolean> {
        try {
            const auth = await AuthDataModel.findById(authId);
            if (!auth || auth.emailVerified) {
                return false;
            }

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