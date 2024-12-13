import axios from 'axios';
import { TestContext } from '../../../main';

interface RefreshTokenResponse {
    success: boolean;
    data: {
        token: string;
        refreshToken: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    };
    error?: string;
}

export async function runRefreshTokenTest(context: TestContext) {
    if (!context.refreshToken || !context.userId) {
        throw new Error('missing required context for token refresh test');
    }

    const response = await axios.post<RefreshTokenResponse>(
        `${context.baseUrl}/api/auth/refresh`,
        {
            refreshToken: context.refreshToken
        }
    );

    if (!response.data.success) {
        throw new Error('token refresh failed');
    }

    context.authToken = response.data.data.token;
    context.refreshToken = response.data.data.refreshToken;
}