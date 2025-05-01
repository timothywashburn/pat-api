import axios from 'axios';
import { TestContext } from '../../../main';
import { UserConfigModel } from '../../../../src/models/mongo/user-config';
import { UpdateUserResponse, UserData } from "@timothyw/pat-common";
import { ApiResponseBody } from "../../../../src/api/types";

interface UserConfigData {
    name: string;
    timezone: string;
    discordID?: string;
    itemListTracking?: {
        channelId: string;
        messageId: string;
    };
}

export async function runUpdateUserConfigTest(context: TestContext) {
    if (!context.authToken || !context.userId) {
        throw new Error('missing required context for update user config test');
    }

    const updates = {
        name: 'Updated Test User'
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

    const user = await UserConfigModel.findById(context.userId);
    if (!user) throw new Error('user not found in database');

    for (const [key, value] of Object.entries(updates)) {
        if (JSON.stringify(response.data.data!.user[key as keyof UserData]) !== JSON.stringify(value)) {
            throw new Error(`${key} not updated correctly in response`);
        }
        if (JSON.stringify(user[key as keyof UserData]) !== JSON.stringify(value)) {
            throw new Error(`${key} not updated correctly in database`);
        }
    }
}