import { Request, Response } from 'express';
import {Types} from "mongoose";
import { AuthId, UserId } from "@timothyw/pat-common";

export interface AuthInfo {
    authId: AuthId;
    userId: UserId;
}

// TODO: move some of this to shared code
export type ApiSuccessResponse<TRes = unknown> = TRes & {
    success: true;
};

export interface ApiErrorResponse {
    success: false;
    error: string;
}

export type ApiResponseBody<TRes = unknown> = ApiSuccessResponse<TRes> | ApiErrorResponse;

export interface ApiRequest<TReq> extends Request {
    body: TReq;
    auth?: AuthInfo;
}

export interface ApiResponse<TRes> extends Response {
    json: (body: ApiResponseBody<TRes>) => this;
}

// export interface ApiResponseBody<TRes> {
//     success: boolean;
//     data?: TRes;
//     error?: string;
// }

export interface ApiEndpoint<TReq = unknown, TRes = unknown> {
    path: string;
    method: 'get' | 'post' | 'put' | 'delete';
    auth?: 'authenticated' | 'verifiedEmail';
    handler: (req: ApiRequest<TReq>, res: ApiResponse<TRes>) => Promise<void>;
}

export const isSuccess = <T>(data: ApiResponseBody<T>): data is ApiSuccessResponse<T> => {
    return data.success;
};