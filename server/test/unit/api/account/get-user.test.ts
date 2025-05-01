import axios from 'axios';
import { TestContext } from '../../../main';
import { UserConfigModel } from '../../../../src/models/mongo/user-config';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetUserResponse } from "@timothyw/pat-common";

export async function runGetUserConfigTest(context: TestContext) {
    if (!context.authToken || !context.userId) {
        throw new Error('missing required context for get user config test');
    }

    const response = await axios.get<ApiResponseBody<GetUserResponse>>(
        `${context.baseUrl}/api/account`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to get user config');

    const user = await UserConfigModel.findById(context.userId);
    if (!user) throw new Error('user not found in database');
}