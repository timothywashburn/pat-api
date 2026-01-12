import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import ItemManager from '../../controllers/item-manager';
import { getUserIdFromAuth } from '../utils/mcp-utils';
import { Serializer, ItemId } from '@timothyw/pat-common';

export function registerAgendaItemTools(server: McpServer) {

    server.registerTool(
        'get_agenda_items',
        {
            description: 'Get agenda items for the user. Can filter by status.',
            inputSchema: z.object({
                filter: z.enum(['all', 'pending', 'overdue']).optional().describe('Filter items: all (default), pending (incomplete), overdue (past due date)'),
            }),
        },
        async (args: any, extra) => {
            const userId = getUserIdFromAuth(extra.authInfo);
            const filter = args.filter || 'all';

            let items;
            switch (filter) {
                case 'pending':
                    items = await ItemManager.getInstance().getPending(userId);
                    break;
                case 'overdue':
                    items = await ItemManager.getInstance().getOverdue(userId);
                    break;
                default:
                    items = await ItemManager.getInstance().getAllByUser(userId);
            }

            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({
                        count: items.length,
                        items: items.map(item => Serializer.serialize(item)),
                    }, null, 2),
                }],
            };
        }
    );

    server.registerTool(
        'create_agenda_item',
        {
            description: 'Create a new agenda item',
            inputSchema: z.object({
                name: z.string().min(1).describe('Name/title of the item (required)'),
                dueDate: z.string().optional().describe('Due date in ISO 8601 format'),
                notes: z.string().optional().describe('Additional notes'),
                urgent: z.boolean().optional().describe('Mark as urgent'),
                category: z.string().optional().describe('Category (should exist in user settings)'),
                type: z.string().optional().describe('Type (should exist in user settings)'),
            }),
        },
        async (args: any, extra) => {
            const userId = getUserIdFromAuth(extra.authInfo);

            try {
                const item = await ItemManager.getInstance().create(userId, {
                    name: args.name,
                    dueDate: args.dueDate,
                    notes: args.notes,
                    urgent: args.urgent,
                    category: args.category,
                    type: args.type,
                });

                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({
                            success: true,
                            item: Serializer.serialize(item),
                        }, null, 2),
                    }],
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : 'Failed to create item',
                        }),
                    }],
                    isError: true,
                };
            }
        }
    );

    server.registerTool(
        'update_agenda_item',
        {
            description: 'Update an existing agenda item',
            inputSchema: z.object({
                itemId: z.string().describe('ID of the item to update (required)'),
                name: z.string().min(1).optional().describe('New name/title'),
                dueDate: z.string().nullish().describe('New due date (ISO 8601), or null to remove'),
                notes: z.string().nullish().describe('New notes, or null to remove'),
                urgent: z.boolean().optional().describe('Urgent flag'),
                category: z.string().nullish().describe('New category, or null to remove'),
                type: z.string().nullish().describe('New type, or null to remove'),
            }),
        },
        async (args: any, extra) => {
            const userId = getUserIdFromAuth(extra.authInfo);
            const itemId = args.itemId as ItemId;

            const updates: Record<string, unknown> = {};
            if (args.name !== undefined) updates.name = args.name;
            if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
            if (args.notes !== undefined) updates.notes = args.notes;
            if (args.urgent !== undefined) updates.urgent = args.urgent;
            if (args.category !== undefined) updates.category = args.category;
            if (args.type !== undefined) updates.type = args.type;

            const item = await ItemManager.getInstance().update(
                userId,
                itemId,
                updates
            );

            if (!item) {
                return {
                    content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: 'Item not found' }) }],
                    isError: true,
                };
            }

            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({ success: true, item: Serializer.serialize(item) }, null, 2),
                }],
            };
        }
    );

    server.registerTool(
        'complete_agenda_item',
        {
            description: 'Mark an agenda item as complete or incomplete',
            inputSchema: z.object({
                itemId: z.string().describe('ID of the item (required)'),
                completed: z.boolean().describe('true to complete, false to uncomplete (required)'),
            }),
        },
        async (args: any, extra) => {
            const userId = getUserIdFromAuth(extra.authInfo);

            const item = await ItemManager.getInstance().setCompleted(
                userId,
                args.itemId as ItemId,
                args.completed
            );

            if (!item) {
                return {
                    content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: 'Item not found or access denied' }) }],
                    isError: true,
                };
            }

            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({ success: true, item: Serializer.serialize(item) }, null, 2),
                }],
            };
        }
    );

    server.registerTool(
        'delete_agenda_item',
        {
            description: 'Delete an agenda item',
            inputSchema: z.object({
                itemId: z.string().describe('ID of the item to delete (required)'),
            }),
        },
        async (args: any, extra) => {
            const userId = getUserIdFromAuth(extra.authInfo);

            const deleted = await ItemManager.getInstance().delete(userId, args.itemId as ItemId);

            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({
                        success: deleted,
                        itemId: args.itemId,
                        ...(deleted ? {} : { error: 'Item not found or access denied' }),
                    }),
                }],
                isError: !deleted,
            };
        }
    );
}
