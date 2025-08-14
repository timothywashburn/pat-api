import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiEndpoint, ApiRequest, ApiResponse } from '../api/types';
import { signInEndpoint } from "../api/endpoints/auth/sign-in";
import { getItemsEndpoint } from "../api/endpoints/items/get-items";
import AuthManager from './auth-manager';
import {createItemEndpoint} from "../api/endpoints/items/create-item";
import {deleteItemEndpoint} from "../api/endpoints/items/delete-item";
import {refreshAuthEndpoint} from "../api/endpoints/auth/refresh-auth";
import {completeItemEndpoint} from "../api/endpoints/items/complete-item";
import {updateUserEndpoint} from "../api/endpoints/account/update-user-config";
import {getUserEndpoint} from "../api/endpoints/account/get-user";
import {createAccountEndpoint} from "../api/endpoints/auth/create-account";
import {resendVerificationEndpoint} from "../api/endpoints/auth/resend-verification";
import {verifyEmailEndpoint} from "../api/endpoints/auth/verify-email";
import {AuthDataModel} from "../models/mongo/auth-data";
import {updateItemEndpoint} from "../api/endpoints/items/update-item";
import {createThoughtEndpoint} from "../api/endpoints/thoughts/create-thought";
import {deleteThoughtEndpoint} from "../api/endpoints/thoughts/delete-thought";
import {getThoughtsEndpoint} from "../api/endpoints/thoughts/get-thoughts";
import {updateThoughtEndpoint} from "../api/endpoints/thoughts/update-thought";
import {createPersonEndpoint} from "../api/endpoints/people/create-person";
import {deletePersonEndpoint} from "../api/endpoints/people/delete-person";
import {getPeopleEndpoint} from "../api/endpoints/people/get-people";
import {updatePersonEndpoint} from "../api/endpoints/people/update-person";
import {createTaskEndpoint} from "../api/endpoints/tasks/create-task";
import {createTaskListEndpoint} from "../api/endpoints/tasks/create-task-list";
import {getTasksEndpoint} from "../api/endpoints/tasks/get-tasks";
import {getTaskListsEndpoint} from "../api/endpoints/tasks/get-task-lists";
import {updateTaskEndpoint} from "../api/endpoints/tasks/update-task";
import {updateTaskListEndpoint} from "../api/endpoints/tasks/update-task-list";
import {completeTaskEndpoint} from "../api/endpoints/tasks/complete-task";
import {deleteTaskEndpoint} from "../api/endpoints/tasks/delete-task";
import {deleteTaskListEndpoint} from "../api/endpoints/tasks/delete-task-list";
import {getHabitsEndpoint} from "../api/endpoints/habits/get-habits";
import {createHabitEndpoint} from "../api/endpoints/habits/create-habit";
import {updateHabitEndpoint} from "../api/endpoints/habits/update-habit";
import {deleteHabitEndpoint} from "../api/endpoints/habits/delete-habit";
import {createHabitEntryEndpoint} from "../api/endpoints/habits/create-habit-entry";
import {deleteHabitEntryEndpoint} from "../api/endpoints/habits/delete-habit-entry";
import { versionEndpoint } from "../api/endpoints/misc/version";
import {createPersonNoteEndpoint} from "../api/endpoints/people/create-person-note";
import {getPersonNotesEndpoint} from "../api/endpoints/people/get-person-notes";
import {updatePersonNoteEndpoint} from "../api/endpoints/people/update-person-note";
import {deletePersonNoteEndpoint} from "../api/endpoints/people/delete-person-note";
import {getNotificationTemplatesEndpoint} from "../api/endpoints/notifications/get-notification-templates";
import {createNotificationTemplateEndpoint} from "../api/endpoints/notifications/create-notification-template";
import {updateNotificationTemplateEndpoint} from "../api/endpoints/notifications/update-notification-template";
import {deleteNotificationTemplateEndpoint} from "../api/endpoints/notifications/delete-notification-template";
import {previewNotificationTemplateEndpoint} from "../api/endpoints/notifications/preview-notification-template";
import {syncNotificationTemplateEndpoint} from "../api/endpoints/notifications/sync-notification-template";
import {getEntitySyncEndpoint} from "../api/endpoints/notifications/get-entity-sync";
import {entitySyncEndpoint} from "../api/endpoints/notifications/entity-sync";

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
        this.addEndpoint(versionEndpoint);

        this.addEndpoint(getUserEndpoint);
        this.addEndpoint(updateUserEndpoint);

        this.addEndpoint(signInEndpoint);
        this.addEndpoint(refreshAuthEndpoint);
        this.addEndpoint(createAccountEndpoint);
        this.addEndpoint(resendVerificationEndpoint);
        this.addEndpoint(verifyEmailEndpoint);

        this.addEndpoint(completeItemEndpoint);
        this.addEndpoint(createItemEndpoint);
        this.addEndpoint(deleteItemEndpoint);
        this.addEndpoint(getItemsEndpoint);
        this.addEndpoint(updateItemEndpoint);

        this.addEndpoint(createThoughtEndpoint);
        this.addEndpoint(deleteThoughtEndpoint);
        this.addEndpoint(getThoughtsEndpoint);
        this.addEndpoint(updateThoughtEndpoint);

        this.addEndpoint(createPersonEndpoint);
        this.addEndpoint(deletePersonEndpoint);
        this.addEndpoint(getPeopleEndpoint);
        this.addEndpoint(updatePersonEndpoint);

        this.addEndpoint(createTaskListEndpoint);
        this.addEndpoint(getTaskListsEndpoint);
        this.addEndpoint(updateTaskListEndpoint);
        this.addEndpoint(deleteTaskListEndpoint);
        this.addEndpoint(createTaskEndpoint);
        this.addEndpoint(getTasksEndpoint);
        this.addEndpoint(updateTaskEndpoint);
        this.addEndpoint(completeTaskEndpoint);
        this.addEndpoint(deleteTaskEndpoint);

        this.addEndpoint(getHabitsEndpoint);
        this.addEndpoint(createHabitEndpoint);
        this.addEndpoint(updateHabitEndpoint);
        this.addEndpoint(deleteHabitEndpoint);
        this.addEndpoint(createHabitEntryEndpoint);
        this.addEndpoint(deleteHabitEntryEndpoint);

        this.addEndpoint(createPersonNoteEndpoint);
        this.addEndpoint(getPersonNotesEndpoint);
        this.addEndpoint(updatePersonNoteEndpoint);
        this.addEndpoint(deletePersonNoteEndpoint);

        this.addEndpoint(getNotificationTemplatesEndpoint);
        this.addEndpoint(createNotificationTemplateEndpoint);
        this.addEndpoint(updateNotificationTemplateEndpoint);
        this.addEndpoint(deleteNotificationTemplateEndpoint);
        this.addEndpoint(previewNotificationTemplateEndpoint);
        this.addEndpoint(syncNotificationTemplateEndpoint);
        this.addEndpoint(getEntitySyncEndpoint);
        this.addEndpoint(entitySyncEndpoint);

        console.log(`registered ${this.endpoints.length} api endpoints`);
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