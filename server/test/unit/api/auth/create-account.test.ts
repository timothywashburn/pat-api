import axios from 'axios';
import { TestContext } from '../../../main';
import { CreateAccountResponse, UserId } from "@timothyw/pat-common";
import { ApiResponseBody } from "../../../../src/api/types";

export async function runCreateAccountTest(context: TestContext) {
    const response = await axios.post<ApiResponseBody<CreateAccountResponse>>(
        `${context.baseUrl}/api/auth/create-account`,
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

    context.userId = response.data.data!.id as UserId;
}