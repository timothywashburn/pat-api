import axios from 'axios';
import { TestContext } from '../../main';

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

    // Update the context with the new tokens
    context.authToken = response.data.data.token;
    context.refreshToken = response.data.data.refreshToken;

    // Verify the user data in the response
    const userData = response.data.data.user;
    if (userData.id !== context.userId) throw new Error('refresh token returned incorrect user ID');
    if (userData.email !== context.account.email) throw new Error('refresh token returned incorrect email');
    if (userData.name !== context.account.name) throw new Error('refresh token returned incorrect name');
}