import axios from 'axios';
import { TestContext } from '../../../main';
import { UserConfigModel } from '../../../../src/models/mongo/user-config';
import { Types } from 'mongoose';

interface UserConfigData {
    name: string;
    timezone: string;
    discordID?: string;
    itemListTracking?: {
        channelId: string;
        messageId: string;
    };
}

interface UpdateUserConfigResponse {
    success: boolean;
    data: {
        user: UserConfigData & { id: string };
    };
    error?: string;
}

export async function runUpdateUserConfigTest(context: TestContext) {
    if (!context.authToken || !context.userId) {
        throw new Error('missing required context for update user config test');
    }

    const updates = {
        name: 'Updated Test User'
    };

    const response = await axios.put<UpdateUserConfigResponse>(
        `${context.baseUrl}/api/account/config`,
        updates,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to update user config');

    const user = await UserConfigModel.findById(new Types.ObjectId(context.userId));
    if (!user) throw new Error('user not found in database');

    for (const [key, value] of Object.entries(updates)) {
        if (JSON.stringify(response.data.data.user[key as keyof UserConfigData]) !== JSON.stringify(value)) {
            throw new Error(`${key} not updated correctly in response`);
        }
        if (JSON.stringify(user[key as keyof UserConfigData]) !== JSON.stringify(value)) {
            throw new Error(`${key} not updated correctly in database`);
        }
    }
}