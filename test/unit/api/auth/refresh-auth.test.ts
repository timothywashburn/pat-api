import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { RefreshAuthResponse } from "@timothyw/pat-common";
import { post } from "../../../test-utils";

export async function runRefreshTokenTest(context: TestContext) {
    if (!context.refreshToken || !context.userId) {
        throw new Error('missing required context for token refresh test');
    }

    const response = await post<{ refreshToken: string }, RefreshAuthResponse>(
        context,
        "/api/auth/refresh",
        {
            refreshToken: context.refreshToken
        }
    );

    if (!response.success) {
        throw new Error('token refresh failed');
    }

    context.authToken = response.tokenData.accessToken;
    context.refreshToken = response.tokenData.refreshToken;
}