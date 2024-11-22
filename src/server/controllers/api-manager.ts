import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiEndpoint, ApiRequest, ApiResponse } from '../api/types';
import { createAccountEndpoint } from '../api/endpoints/create-account';
import { loginEndpoint } from "../api/endpoints/login";
import { getTasksEndpoint } from "../api/endpoints/get-tasks";
import AuthManager from './auth-manager';
import {createTaskEndpoint} from "../api/endpoints/create-task";
import {deleteTaskEndpoint} from "../api/endpoints/delete-task";
import {refreshTokenEndpoint} from "../api/endpoints/refresh-token";
import {completeTaskEndpoint} from "../api/endpoints/complete-task";
import {updateUserConfigEndpoint} from "../api/endpoints/update-user-config";

export default class ApiManager {
    private static instance: ApiManager;
    private readonly router: Router;
    private endpoints: ApiEndpoint<any, any>[] = [];

    private constructor() {
        this.router = express.Router();
        this.setupMiddleware();
        this.registerEndpoints();
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
        const verified = AuthManager.getInstance().verifyToken(token);

        if (!verified) {
            res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
            return;
        }

        req.auth = verified;
        next();
    };

    private addEndpoint<TReq, TRes>(endpoint: ApiEndpoint<TReq, TRes>) {
        this.endpoints.push(endpoint);

        const handlers: RequestHandler[] = [];
        if (endpoint.requiresAuth) handlers.push(this.handleAuth);
        handlers.push(endpoint.handler);

        this.router[endpoint.method](endpoint.path, ...handlers);
        console.log(`Registered API endpoint: ${endpoint.method.toUpperCase()} ${endpoint.path}`);
    }

    private registerEndpoints() {
        this.addEndpoint(createAccountEndpoint);
        this.addEndpoint(loginEndpoint);
        this.addEndpoint(refreshTokenEndpoint);
        this.addEndpoint(updateUserConfigEndpoint);

        this.addEndpoint(getTasksEndpoint);
        this.addEndpoint(createTaskEndpoint);
        this.addEndpoint(completeTaskEndpoint);
        this.addEndpoint(deleteTaskEndpoint);
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