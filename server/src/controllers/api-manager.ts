import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiEndpoint, ApiRequest, ApiResponse } from '../api/types';
import { loginEndpoint } from "../api/endpoints/auth/login";
import { getItemsEndpoint } from "../api/endpoints/items/get-items";
import AuthManager from './auth-manager';
import {createItemEndpoint} from "../api/endpoints/items/create-item";
import {deleteItemEndpoint} from "../api/endpoints/items/delete-item";
import {refreshAuthEndpoint} from "../api/endpoints/auth/refresh-auth";
import {completeItemEndpoint} from "../api/endpoints/items/complete-item";
import {updateUserConfigEndpoint} from "../api/endpoints/account/update-user-config";
import {getUserConfigEndpoint} from "../api/endpoints/account/get-user-config";
import {registerEndpoint} from "../api/endpoints/auth/register";
import {resendVerificationEndpoint} from "../api/endpoints/auth/resend-verification";
import {verifyEmailEndpoint} from "../api/endpoints/auth/verify-email";
import {AuthDataModel} from "../models/mongo/auth-data";
import {updateItemEndpoint} from "../api/endpoints/items/update-item";

export default class ApiManager {
    private static instance: ApiManager;
    private readonly router: Router;
    private endpoints: ApiEndpoint<any, any>[] = [];

    private constructor() {
        this.router = express.Router();
        this.setupMiddleware();
        this.registerEndpoints();
    }

    private registerEndpoints() {
        this.addEndpoint(getUserConfigEndpoint);
        this.addEndpoint(updateUserConfigEndpoint);

        this.addEndpoint(loginEndpoint);
        this.addEndpoint(refreshAuthEndpoint);
        this.addEndpoint(registerEndpoint);
        this.addEndpoint(resendVerificationEndpoint);
        this.addEndpoint(verifyEmailEndpoint);

        this.addEndpoint(completeItemEndpoint);
        this.addEndpoint(createItemEndpoint);
        this.addEndpoint(deleteItemEndpoint);
        this.addEndpoint(getItemsEndpoint);
        this.addEndpoint(updateItemEndpoint);
    }

    private setupMiddleware() {
        this.router.use(express.json());

        this.router.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });

        this.router.use((req, res, next) => {
            if (!req.path.startsWith('/api')) {
                next();
                return;
            }

            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${req.method} ${req.path}`);
            next();
        });

        this.router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
            console.error(error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        });
    }

    private handleAuth: RequestHandler = async (
        req: ApiRequest<any>,
        res: ApiResponse<any>,
        next
    ): Promise<void> => {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'No token provided'
            });
            return;
        }

        const token = authHeader.split(' ')[1];
        const decoded = AuthManager.getInstance().verifyToken(token);

        if (!decoded) {
            res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
            return;
        }

        req.auth = decoded;
        next();
    };

    private handleEmailVerification: RequestHandler = async (
        req: ApiRequest<any>,
        res: ApiResponse<any>,
        next
    ): Promise<void> => {
        const auth = await AuthDataModel.findById(req.auth?.authId);
        if (!auth) {
            res.status(403).json({
                success: false,
                error: 'Could not find auth'
            });
            return;
        }

        if (!auth.emailVerified) {
            res.status(403).json({
                success: false,
                error: 'Email not verified'
            });
            return;
        }
        next();
    };

    private addEndpoint<TReq, TRes>(endpoint: ApiEndpoint<TReq, TRes>) {
        this.endpoints.push(endpoint);

        const handlers: RequestHandler[] = [];
        if (endpoint.auth == 'authenticated' || endpoint.auth == 'verifiedEmail') handlers.push(this.handleAuth);
        if (endpoint.auth == 'verifiedEmail') handlers.push(this.handleEmailVerification);
        handlers.push(endpoint.handler);

        this.router[endpoint.method](endpoint.path, ...handlers);
        console.log(`registered api endpoint: ${endpoint.method.toUpperCase()} ${endpoint.path}`);
    }

    getRouter(): Router {
        return this.router;
    }

    static getInstance(): ApiManager {
        if (!ApiManager.instance) {
            ApiManager.instance = new ApiManager();
        }
        return ApiManager.instance;
    }
}