import { Request, Response } from 'express';
import {Types} from "mongoose";

export interface ApiRequest<TReq> extends Request {
    body: TReq;
    auth?: {
        authId: Types.ObjectId;
        userId?: Types.ObjectId;
    };
}

export interface ApiResponse<TRes> extends Response {
    json: (body: ApiResponseBody<TRes>) => this;
}

export interface ApiResponseBody<TRes> {
    success: boolean;
    data?: TRes;
    error?: string;
}

export interface ApiEndpoint<TReq = unknown, TRes = unknown> {
    path: string;
    method: 'get' | 'post' | 'put' | 'delete';
    requiresAuth: boolean;
    handler: (req: ApiRequest<TReq>, res: ApiResponse<TRes>) => Promise<void>;
}