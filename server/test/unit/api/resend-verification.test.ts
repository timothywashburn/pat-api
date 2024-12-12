import axios from 'axios';
import { TestContext } from '../../main';

interface ResendVerificationResponse {
    success: boolean;
    data: {
        sent: boolean;
    };
}

export async function runResendVerificationTest(context: TestContext) {
    if (!context.userId || !context.authToken) {
        throw new Error('missing required context for resend verification test');
    }

    const response = await axios.post<ResendVerificationResponse>(
        `${context.baseUrl}/api/auth/resend-verification`,
        {},
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to resend verification email');
    if (!response.data.data.sent) throw new Error('verification email not marked as sent');
}