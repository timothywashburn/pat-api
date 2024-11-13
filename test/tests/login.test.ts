import axios from 'axios';
import { TestContext } from '../main';

interface LoginResponse {
    success: boolean;
    data: {
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    };
    error?: string;
}

export async function runLoginTest(context: TestContext) {
    const loginData = {
        email: 'test@example.com',
        password: 'testpassword123'
    };

    const response = await axios.post<LoginResponse>(
        `${context.baseUrl}/api/auth/login`,
        loginData
    );

    if (!response.data.success) {
        throw new Error('login failed');
    }

    context.authToken = response.data.data.token;
}