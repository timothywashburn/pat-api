import axios from 'axios';
import { TestContext } from '../main';

interface CreateAccountResponse {
    success: boolean;
    data: {
        id: string;
        name: string;
        email: string;
    };
    error?: string;
}

export async function runCreateAccountTest(context: TestContext) {
    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword123'
    };

    const response = await axios.post<CreateAccountResponse>(
        `${context.baseUrl}/api/account/create`,
        testUser
    );

    if (!response.data.success) {
        throw new Error('account creation failed');
    }

    context.userId = response.data.data.id;
}