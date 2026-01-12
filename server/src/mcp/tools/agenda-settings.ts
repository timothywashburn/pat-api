import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import UserManager from '../../controllers/user-manager';
import { getUserIdFromAuth } from '../utils/mcp-utils';

export function registerAgendaSettingsTools(server: McpServer) {

    server.registerTool(
        'get_agenda_settings',
        {
            description: 'Get the available item categories and types for agenda items',
            inputSchema: z.object({}),
        },
        async (_args: any, extra) => {
            const userId = getUserIdFromAuth(extra.authInfo);

            const user = await UserManager.getInstance().getById(userId);

            if (!user) {
                return {
                    content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: 'User not found' }) }],
                    isError: true,
                };
            }

            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({
                        itemCategories: user.config?.agenda?.itemCategories || [],
                        itemTypes: user.config?.agenda?.itemTypes || [],
                    }, null, 2),
                }],
            };
        }
    );

    server.registerTool(
        'update_agenda_settings',
        {
            description: 'Update the available item categories and/or types. Provide the full list for each field you want to update.',
            inputSchema: z.object({
                itemCategories: z.array(z.string()).optional().describe('Full list of categories to set'),
                itemTypes: z.array(z.string()).optional().describe('Full list of types to set'),
            }),
        },
        async (args: any, extra) => {
            const userId = getUserIdFromAuth(extra.authInfo);

            const updates: { config: { agenda: { itemCategories?: string[]; itemTypes?: string[] } } } = {
                config: { agenda: {} }
            };

            if (args.itemCategories !== undefined) {
                updates.config.agenda.itemCategories = args.itemCategories;
            }
            if (args.itemTypes !== undefined) {
                updates.config.agenda.itemTypes = args.itemTypes;
            }

            const user = await UserManager.getInstance().update(
                userId,
                updates
            );

            if (!user) {
                return {
                    content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: 'Failed to update settings' }) }],
                    isError: true,
                };
            }

            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({
                        success: true,
                        itemCategories: user.config?.agenda?.itemCategories || [],
                        itemTypes: user.config?.agenda?.itemTypes || [],
                    }, null, 2),
                }],
            };
        }
    );
}
