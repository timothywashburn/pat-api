import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { ResendVerificationResponse } from "@timothyw/pat-common";

export async function runResendVerificationTest(context: TestContext) {
    if (!context.userId || !context.authToken) {
        throw new Error('missing required context for resend verification test');
    }

    const response = await axios.post<ApiResponseBody<ResendVerificationResponse>>(
        `${context.baseUrl}/api/auth/resend-verification`,
        {},
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to resend verification email');
    if (!response.data.data!.sent) throw new Error('verification email not marked as sent');
}