import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { SignInResponse } from "@timothyw/pat-common";
import { post } from "../../../test-utils";

export async function runSignInTest(context: TestContext) {
    const response = await post<typeof context.account, SignInResponse>(
        context,
        "/api/auth/sign-in",
        context.account,
        false
    );

    if (!response.success) {
        throw new Error('sign in failed');
    }

    context.authToken = response.tokenData.accessToken;
    context.refreshToken = response.tokenData.refreshToken;
}