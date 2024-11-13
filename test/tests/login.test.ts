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
    console.log('\nrunning login test')

    const loginData = {
        email: 'test@example.com',
        password: 'testpassword123'
    };

    try {
        const response = await axios.post<LoginResponse>(
            `${context.baseUrl}/api/auth/login`,
            loginData
        );

        if (!response.data.success) {
            throw new Error('login failed');
        }

        context.authToken = response.data.data.token;
        console.log('login test passed')
    } catch (error) {
        console.error('login test failed:', error);
        throw error;
    }
}