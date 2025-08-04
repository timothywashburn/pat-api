import { TestContext } from '../../../main';
import { ModuleType, UpdateUserRequest, UpdateUserResponse } from "@timothyw/pat-common";
import { ApiResponseBody } from "../../../../src/api/types";
import { put } from "../../../test-utils";

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

    const response = await put<UpdateUserRequest, UpdateUserResponse>(
        context,
        "/api/account",
        updates
    );

    if (!response.success) throw new Error('failed to update user config');
}