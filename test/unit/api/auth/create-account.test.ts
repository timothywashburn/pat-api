import { CreateAccountResponse, UserId } from "@timothyw/pat-common";
import { ApiResponseBody } from "../../../../src/api/types";
import { TestContext } from "../../../main";
import { post } from "../../../test-utils";

export async function runCreateAccountTest(context: TestContext) {
    const response = await post<{
        name: string;
        email: string;
        password: string;
        skipVerificationEmail: boolean;
    }, CreateAccountResponse>(
        context,
        "/api/auth/create-account",
        {
            name: context.account.name,
            email: context.account.email,
            password: context.account.password,
            skipVerificationEmail: context.skipVerificationEmail
        },
        false
    );

    if (!response.success) {
        throw new Error('account creation failed');
    }

    context.userId = response.id as UserId; // TODO: fix
}