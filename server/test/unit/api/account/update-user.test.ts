import axios from 'axios';
import { TestContext } from '../../../main';
import { UpdateUserRequest, UpdateUserResponse, UserData } from "@timothyw/pat-common";
import { ApiResponseBody } from "../../../../src/api/types";

export async function runUpdateUserConfigTest(context: TestContext) {
    if (!context.authToken || !context.userId) {
        throw new Error('missing required context for update user config test');
    }

    const updates: UpdateUserRequest = {
        name: 'Test',
        sandbox: {
            devices: [{
                pushToken: process.env.TEST_EXPONENT_TOKEN
            }]
        }
    };

    const response = await axios.put<ApiResponseBody<UpdateUserResponse>>(
        `${context.baseUrl}/api/account`,
        updates,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to update user config');
}