import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { ResendVerificationResponse } from "@timothyw/pat-common";
import { post } from "../../../test-utils";

export async function runResendVerificationTest(context: TestContext) {
    if (!context.userId || !context.authToken) {
        throw new Error('missing required context for resend verification test');
    }

    const response = await post<{}, ResendVerificationResponse>(
        context,
        "/api/auth/resend-verification",
        {}
    );

    if (!response.success) throw new Error('failed to resend verification email');
    if (!response.sent) throw new Error('verification email not marked as sent');
}