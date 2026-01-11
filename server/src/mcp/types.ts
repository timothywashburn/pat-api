import { UserId } from '@timothyw/pat-common';
import { AuthInfo as McpAuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

export function getUserIdFromAuth(authInfo?: McpAuthInfo): UserId {
    if (!authInfo?.extra?.userId) throw new Error('User not authenticated');
    return authInfo.extra.userId as UserId;
}
