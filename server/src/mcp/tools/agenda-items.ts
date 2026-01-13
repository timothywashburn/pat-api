import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import ItemManager from '../../controllers/item-manager';
import { getUserIdFromAuth } from '../utils/mcp-utils';
import { Serializer, ItemId, UpdateAgendaItemRequest } from '@timothyw/pat-common';
import UserManager from '../../controllers/user-manager';
import { TZDate } from '@date-fns/tz';

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
        'create_agenda_items',
        {
            description: 'Create one or more agenda items',
            inputSchema: z.object({
                items: z.array(z.object({
                    name: z.string().min(1).describe('Name/title of the item'),
                    dueDate: z.string().optional().describe('Due date in ISO 8601 format'),
                    notes: z.string().optional().describe('Additional notes'),
                    urgent: z.boolean().optional().describe('Mark as urgent'),
                    category: z.string().optional().describe('Category (should exist in user settings)'),
                    type: z.string().optional().describe('Type (should exist in user settings)'),
                })).min(1).describe('Array of items to create (pass array of 1 item for single creation)'),
            }),
        },
        async (args: any, extra) => {
            const userId = getUserIdFromAuth(extra.authInfo);

            try {
                const user = await UserManager.getInstance().getById(userId);
                const timezone = user!.timezone;

                const itemsWithParsedDates = args.items.map((item: any) => ({
                    ...item,
                    dueDate: item.dueDate ? new TZDate(item.dueDate, timezone) : undefined
                }));

                const items = await ItemManager.getInstance().createMany(userId, itemsWithParsedDates);
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({
                            success: true,
                            count: items.length,
                            items: items.map(item => Serializer.serialize(item)),
                        }, null, 2),
                    }],
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : 'Failed to create item(s)',
                        }),
                    }],
                    isError: true,
                };
            }
        }
    );

    server.registerTool(
        'update_agenda_items',
        {
            description: 'Update one or more existing agenda items',
            inputSchema: z.object({
                items: z.array(z.object({
                    itemId: z.string().describe('ID of the item to update'),
                    name: z.string().min(1).optional().describe('New name/title'),
                    dueDate: z.string().nullish().describe('New due date (ISO 8601), or null to remove'),
                    notes: z.string().nullish().describe('New notes, or null to remove'),
                    urgent: z.boolean().optional().describe('Urgent flag'),
                    category: z.string().nullish().describe('New category, or null to remove'),
                    type: z.string().nullish().describe('New type, or null to remove'),
                })).min(1).describe('Array of items to update (pass array of 1 item for single update)'),
            }),
        },
        async (args: any, extra) => {
            const userId = getUserIdFromAuth(extra.authInfo);

            const user = await UserManager.getInstance().getById(userId);
            const timezone = user!.timezone;

            const updateRequests = args.items.map((item: any) => {
                const updates: UpdateAgendaItemRequest = {};
                if (item.name !== undefined) updates.name = item.name;
                if (item.dueDate !== undefined) {
                    updates.dueDate = item.dueDate === null ? null : new TZDate(item.dueDate, timezone).toString();
                }
                if (item.notes !== undefined) updates.notes = item.notes;
                if (item.urgent !== undefined) updates.urgent = item.urgent;
                if (item.category !== undefined) updates.category = item.category;
                if (item.type !== undefined) updates.type = item.type;

                return {
                    itemId: item.itemId as ItemId,
                    updates
                };
            });

            const results = await ItemManager.getInstance().updateMany(userId, updateRequests);

            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({
                        success: true,
                        count: results.length,
                        results: results.map(r => ({
                            itemId: r.itemId,
                            success: r.success,
                            ...(r.item ? { item: Serializer.serialize(r.item) } : { error: 'Item not found' })
                        })),
                    }, null, 2),
                }],
            };
        }
    );

    server.registerTool(
        'complete_agenda_items',
        {
            description: 'Mark one or more agenda items as complete or incomplete',
            inputSchema: z.object({
                itemIds: z.array(z.string()).min(1).describe('Array of item IDs (pass array of 1 ID for single operation)'),
                completed: z.boolean().describe('true to complete, false to uncomplete (required)'),
            }),
        },
        async (args: any, extra) => {
            const userId = getUserIdFromAuth(extra.authInfo);

            const results = await ItemManager.getInstance().setCompletedMany(
                userId,
                args.itemIds as ItemId[],
                args.completed
            );

            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({
                        success: true,
                        count: results.length,
                        results: results.map(r => ({
                            itemId: r.itemId,
                            success: r.success,
                            ...(r.item ? { item: Serializer.serialize(r.item) } : { error: 'Item not found or access denied' })
                        })),
                    }, null, 2),
                }],
            };
        }
    );

    server.registerTool(
        'delete_agenda_items',
        {
            description: 'Delete one or more agenda items',
            inputSchema: z.object({
                itemIds: z.array(z.string()).min(1).describe('Array of item IDs to delete (pass array of 1 ID for single deletion)'),
            }),
        },
        async (args: any, extra) => {
            const userId = getUserIdFromAuth(extra.authInfo);

            const results = await ItemManager.getInstance().deleteManyItems(userId, args.itemIds as ItemId[]);

            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({
                        success: true,
                        count: results.length,
                        results: results.map(r => ({
                            itemId: r.itemId,
                            success: r.success,
                            ...(r.success ? {} : { error: 'Item not found or access denied' })
                        })),
                    }, null, 2),
                }],
            };
        }
    );
}
