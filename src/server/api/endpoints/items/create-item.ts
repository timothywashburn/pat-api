import { ApiEndpoint } from '../../types';
import ItemManager from '../../../controllers/item-manager';
import { Types } from 'mongoose';
import { z } from 'zod';

const createItemSchema = z.object({
    name: z.string().min(1),
    dueDate: z.string().nullish(),
    notes: z.string().optional(),
    urgent: z.boolean().optional().default(false),
    category: z.string().nullish(),
    type: z.string().nullish()
});

type CreateItemRequest = z.infer<typeof createItemSchema>;

interface CreateItemResponse {
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

export const createItemEndpoint: ApiEndpoint<CreateItemRequest, CreateItemResponse> = {
    path: '/api/items',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = createItemSchema.parse(req.body);
            const userId = new Types.ObjectId(req.auth!.userId);

            const item = await ItemManager.getInstance().create(userId, {
                name: data.name,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                notes: data.notes,
                urgent: data.urgent,
                category: data.category ?? null,
                type: data.type ?? null
            });

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
            let message = 'Failed to create item';

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