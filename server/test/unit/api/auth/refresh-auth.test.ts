import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { RefreshAuthResponse } from "@timothyw/pat-common";

export async function runRefreshTokenTest(context: TestContext) {
    if (!context.refreshToken || !context.userId) {
        throw new Error('missing required context for token refresh test');
    }

    const response = await axios.post<ApiResponseBody<RefreshAuthResponse>>(
        `${context.baseUrl}/api/auth/refresh`,
        {
            refreshToken: context.refreshToken
        }
    );

    if (!response.data.success) {
        throw new Error('token refresh failed');
    }

    context.authToken = response.data.data!.tokenData.accessToken;
    context.refreshToken = response.data.data!.tokenData.refreshToken;
}