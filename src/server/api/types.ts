import { Request, Response } from 'express';

export interface ApiRequest<TReq> extends Request {
    body: TReq;
}

export interface ApiResponse<TReq> extends Response {
    json: (body: ApiResponseBody<TReq>) => this;
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