import axios from 'axios';
import { TestContext } from '../../../main';
import { ModuleType, UpdateUserRequest, UpdateUserResponse } from "@timothyw/pat-common";
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
        },
        config: {
            modules: [
                {
                    type: ModuleType.AGENDA,
                    visible: true,
                },
                {
                    type: ModuleType.INBOX,
                    visible: true,
                },
                {
                    type: ModuleType.TASKS,
                    visible: true,
                },
                {
                    type: ModuleType.HABITS,
                    visible: true,
                },
                {
                    type: ModuleType.SETTINGS,
                    visible: true,
                },
                {
                    type: ModuleType.DEV,
                    visible: true
                },
                {
                    type: ModuleType.PEOPLE,
                    visible: false,
                },
            ]
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