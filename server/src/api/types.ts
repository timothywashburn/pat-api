import { Request, Response } from 'express';
import {Types} from "mongoose";
import { AuthId, UserId } from "@timothyw/pat-common";

export interface AuthInfo {
    authId: AuthId;
    userId: UserId;
}

export interface ApiRequest<TReq> extends Request {
    body: TReq;
    auth?: AuthInfo;
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
    auth?: 'authenticated' | 'verifiedEmail';
    handler: (req: ApiRequest<TReq>, res: ApiResponse<TRes>) => Promise<void>;
}