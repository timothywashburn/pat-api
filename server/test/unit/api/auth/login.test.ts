import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { LoginResponse } from "@timothyw/pat-common";

export async function runLoginTest(context: TestContext) {
    const response = await axios.post<ApiResponseBody<LoginResponse>>(
        `${context.baseUrl}/api/auth/login`,
        context.account
    );

    if (!response.data.success) {
        throw new Error('login failed');
    }

    context.authToken = response.data.data!.tokenData.accessToken;
    context.refreshToken = response.data.data!.tokenData.refreshToken;
}