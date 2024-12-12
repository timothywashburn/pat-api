import axios from 'axios';
import { TestContext } from '../../main';

interface LoginResponse {
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

export async function runLoginTest(context: TestContext) {
    const response = await axios.post<LoginResponse>(
        `${context.baseUrl}/api/auth/login`,
        context.account
    );

    if (!response.data.success) {
        throw new Error('login failed');
    }

    context.authToken = response.data.data.token;
    context.refreshToken = response.data.data.refreshToken;
}