import express, { Router } from 'express';
import { ApiEndpoint } from '../api/types';
import { createAccountEndpoint } from '../api/endpoints/create-account';
import {loginEndpoint} from "../api/endpoints/login";
import {getTasksEndpoint} from "../api/endpoints/get-tasks";

export default class ApiManager {
    private static instance: ApiManager;
    private readonly router: Router;
    private endpoints: ApiEndpoint[] = [];

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

    private registerEndpoints() {
        this.addEndpoint(createAccountEndpoint);
        this.addEndpoint(loginEndpoint);
        this.addEndpoint(getTasksEndpoint);
    }

    private addEndpoint(endpoint: ApiEndpoint) {
        this.endpoints.push(endpoint);
        this.router[endpoint.method](endpoint.path, endpoint.handler);
        console.log(`Registered API endpoint: ${endpoint.method.toUpperCase()} ${endpoint.path}`);
    }

    getRouter(): Router {
        return this.router;
    }

    listEndpoints(): string[] {
        return this.endpoints.map(e => `${e.method.toUpperCase()} ${e.path}`);
    }

    static getInstance(): ApiManager {
        if (!ApiManager.instance) ApiManager.instance = new ApiManager();
        return ApiManager.instance;
    }
}