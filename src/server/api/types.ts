import { Request, Response } from 'express';

export interface ApiRequest<T = any> extends Request {
    body: T;
}

export interface ApiResponse<T = any> extends Response {
    json: (body: ApiResponseBody<T>) => this;
}

export interface ApiResponseBody<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface ApiEndpoint {
    path: string;
    method: 'get' | 'post' | 'put' | 'delete';
    handler: (req: ApiRequest, res: ApiResponse) => Promise<void>;
}