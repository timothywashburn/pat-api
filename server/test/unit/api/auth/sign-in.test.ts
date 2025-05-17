import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { SignInResponse } from "@timothyw/pat-common";

export async function runSignInTest(context: TestContext) {
    const response = await axios.post<ApiResponseBody<SignInResponse>>(
        `${context.baseUrl}/api/auth/sign-in`,
        context.account
    );

    if (!response.data.success) {
        throw new Error('sign in failed');
    }

    context.authToken = response.data.data!.tokenData.accessToken;
    context.refreshToken = response.data.data!.tokenData.refreshToken;
}