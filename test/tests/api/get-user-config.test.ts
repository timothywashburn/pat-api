import axios from 'axios';
import { TestContext } from '../../main';
import { UserConfigModel } from '../../../src/server/models/mongo/user-config';
import { Types } from 'mongoose';

interface GetUserConfigResponse {
    success: boolean;
    data: {
        user: {
            id: string;
            name: string;
            timezone: string;
            discordID?: string;
            taskListTracking?: {
                channelId: string;
                messageId: string;
            };
            iosApp?: {
                panels: Array<{
                    panel: 'agenda' | 'tasks' | 'inbox' | 'settings';
                    visible: boolean;
                }>;
            };
        };
    };
    error?: string;
}

export async function runGetUserConfigTest(context: TestContext) {
    if (!context.authToken || !context.userId) {
        throw new Error('missing required context for get user config test');
    }

    const response = await axios.get<GetUserConfigResponse>(
        `${context.baseUrl}/api/account/config`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to get user config');

    const user = await UserConfigModel.findById(new Types.ObjectId(context.userId));
    if (!user) throw new Error('user not found in database');
}