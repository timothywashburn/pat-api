import { Request, Response } from 'express';
import { Types } from 'mongoose';

export interface ApiRequest<T = any> extends Request {
    body: T;
}

export interface AuthenticatedRequest<T = any> extends ApiRequest<T> {
    userId: Types.ObjectId;
}

export interface ApiResponse<T = any> extends Response {
    json: (body: ApiResponseBody<T>) => this;
}

export interface ApiResponseBody<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface ApiEndpoint<TRequest = any> {
    path: string;
    method: 'get' | 'post' | 'put' | 'delete';
    handler: (req: ApiRequest<TRequest>, res: ApiResponse) => Promise<void>;
}

export interface ProtectedApiEndpoint<TRequest = any> {
    path: string;
    method: 'get' | 'post' | 'put' | 'delete';
    handler: (req: AuthenticatedRequest<TRequest>, res: ApiResponse) => Promise<void>;
}