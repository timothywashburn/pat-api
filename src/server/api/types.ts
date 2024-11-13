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

type RequestType<T, Auth extends boolean> = Auth extends true
    ? AuthenticatedRequest<T>
    : ApiRequest<T>;

export interface ApiEndpointConfig<TRequest = any, TRequiresAuth extends boolean = boolean> {
    path: string;
    method: 'get' | 'post' | 'put' | 'delete';
    requiresAuth: TRequiresAuth;
    handler: (req: RequestType<TRequest, TRequiresAuth>, res: ApiResponse) => Promise<void>;
}