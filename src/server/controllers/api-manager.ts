import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiEndpointConfig, ApiRequest, ApiResponse, AuthenticatedRequest } from '../api/types';
import { createAccountEndpoint } from '../api/endpoints/create-account';
import { loginEndpoint } from "../api/endpoints/login";
import { getTasksEndpoint } from "../api/endpoints/get-tasks";
import AuthManager from './auth-manager';

export default class ApiManager {
    private static instance: ApiManager;
    private readonly router: Router;
    private endpoints: ApiEndpointConfig[] = [];

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
    }

    private handleAuth: RequestHandler = async (
        req,
        res,
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

        (req as AuthenticatedRequest).userId = verified.userId;
        next();
    };

    private wrapHandler<TRequest, TRequiresAuth extends boolean>(
        handler: ApiEndpointConfig<TRequest, TRequiresAuth>['handler']
    ): RequestHandler {
        return async (req, res, next) => {
            try {
                await handler(req as any, res as any);
            } catch (error) {
                next(error);
            }
        };
    }

    private addEndpoint<TRequest, TRequiresAuth extends boolean>(
        endpoint: ApiEndpointConfig<TRequest, TRequiresAuth>
    ) {
        this.endpoints.push(endpoint);

        const handlers: RequestHandler[] = [];
        if (endpoint.requiresAuth) {
            handlers.push(this.handleAuth);
        }
        handlers.push(this.wrapHandler(endpoint.handler));

        this.router[endpoint.method](endpoint.path, ...handlers);
        console.log(`Registered API endpoint: ${endpoint.method.toUpperCase()} ${endpoint.path}`);
    }

    private registerEndpoints() {
        this.addEndpoint(createAccountEndpoint as ApiEndpointConfig<any, false>);
        this.addEndpoint(loginEndpoint as ApiEndpointConfig<any, false>);
        this.addEndpoint(getTasksEndpoint as ApiEndpointConfig<any, true>);
    }

    getRouter(): Router {
        return this.router;
    }

    listEndpoints(): string[] {
        return this.endpoints.map(e => `${e.method.toUpperCase()} ${e.path}`);
    }

    static getInstance(): ApiManager {
        if (!ApiManager.instance) {
            ApiManager.instance = new ApiManager();
        }
        return ApiManager.instance;
    }
}