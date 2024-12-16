import axios from 'axios';
import { TestContext } from '../../../main';

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
    const response = await axios.post<CreateAccountResponse>(
        `${context.baseUrl}/api/auth/register`,
        {
            name: context.account.name,
            email: context.account.email,
            password: context.account.password,
            skipVerificationEmail: context.skipVerificationEmail
        }
    );

    if (!response.data.success) {
        throw new Error('account creation failed');
    }

    context.userId = response.data.data.id;
}