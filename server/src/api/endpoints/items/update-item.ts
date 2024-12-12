import { ApiEndpoint } from '../../types';
import ItemManager from '../../../controllers/item-manager';
import { Types } from 'mongoose';
import { z } from 'zod';

const updateItemSchema = z.object({
    name: z.string().min(1).optional(),
    dueDate: z.string().nullish(),
    notes: z.string().optional(),
    urgent: z.boolean().optional(),
    category: z.string().nullish(),
    type: z.string().nullish()
});

type UpdateItemRequest = z.infer<typeof updateItemSchema>;

interface UpdateItemResponse {
    item: {
        id: string;
        name: string;
        dueDate?: string;
        notes?: string;
        completed: boolean;
        urgent: boolean;
        category?: string;
        type?: string;
    };
}

export const updateItemEndpoint: ApiEndpoint<UpdateItemRequest, UpdateItemResponse> = {
    path: '/api/items/:itemId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = updateItemSchema.parse(req.body);
            const itemId = new Types.ObjectId(req.params.itemId);

            const item = await ItemManager.getInstance().update(itemId, {
                name: data.name,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                notes: data.notes,
                urgent: data.urgent,
                category: data.category ?? null,
                type: data.type ?? null
            });

            if (!item) {
                res.status(404).json({
                    success: false,
                    error: 'Item not found'
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    item: {
                        id: item._id.toString(),
                        name: item.name,
                        dueDate: item.dueDate?.toISOString(),
                        notes: item.notes,
                        completed: item.completed,
                        urgent: item.urgent,
                        category: item.category ?? undefined,
                        type: item.type ?? undefined
                    }
                }
            });
        } catch (error) {
            let message = 'Failed to update item';

            if (error instanceof z.ZodError) {
                message = error.errors[0].message;
            }

            res.status(400).json({
                success: false,
                error: message
            });
        }
    }
};