import axios from 'axios';
import { TestContext } from './main';
import { ApiResponseBody } from "../src/api/types";

export async function get<TParams extends Record<string, any>, TRes>(
    context: TestContext,
    endpoint: string,
    params?: TParams,
    requireAuth: boolean = true
): Promise<ApiResponseBody<TRes>> {
    const headers: Record<string, string> = {};
    if (requireAuth) {
        headers.Authorization = `Bearer ${context.authToken}`;
    }
    
    const response = await axios.get<ApiResponseBody<TRes>>(`${context.baseUrl}${endpoint}`, {
        headers,
        params
    });
    return response.data;
}

export async function post<TReq, TRes>(
    context: TestContext,
    endpoint: string,
    data: TReq,
    requireAuth: boolean = true
): Promise<ApiResponseBody<TRes>> {
    const headers: Record<string, string> = {};
    if (requireAuth) {
        headers.Authorization = `Bearer ${context.authToken}`;
    }
    
    const response = await axios.post<ApiResponseBody<TRes>>(`${context.baseUrl}${endpoint}`, data, {
        headers
    });
    return response.data;
}

export async function put<TReq, TRes>(
    context: TestContext,
    endpoint: string,
    data: TReq,
    requireAuth: boolean = true
): Promise<ApiResponseBody<TRes>> {
    const headers: Record<string, string> = {};
    if (requireAuth) {
        headers.Authorization = `Bearer ${context.authToken}`;
    }
    
    const response = await axios.put<ApiResponseBody<TRes>>(`${context.baseUrl}${endpoint}`, data, {
        headers
    });
    return response.data;
}

export async function del<TRes>(
    context: TestContext,
    endpoint: string,
    requireAuth: boolean = true
): Promise<ApiResponseBody<TRes>> {
    const headers: Record<string, string> = {};
    if (requireAuth) {
        headers.Authorization = `Bearer ${context.authToken}`;
    }
    
    const response = await axios.delete<ApiResponseBody<TRes>>(`${context.baseUrl}${endpoint}`, {
        headers
    });
    return response.data;
}