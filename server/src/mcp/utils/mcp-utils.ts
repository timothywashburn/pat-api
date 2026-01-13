import { UserId } from '@timothyw/pat-common';
import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

export function getUserIdFromAuth(authInfo?: AuthInfo): UserId {
    if (!authInfo?.extra?.userId) throw new Error('User not authenticated');
    return authInfo.extra.userId as UserId;
}
