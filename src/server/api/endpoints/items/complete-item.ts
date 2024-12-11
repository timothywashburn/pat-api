import { ApiEndpoint } from '../../types';
import ItemManager from '../../../controllers/item-manager';
import { Types } from 'mongoose';
import { z } from 'zod';

const completeItemSchema = z.object({
    completed: z.boolean()
});

type CompleteItemRequest = z.infer<typeof completeItemSchema>;

interface CompleteItemResponse {
    item: {
        id: string;
        name: string;
        completed: boolean;
        dueDate?: string;
        notes?: string;
    };
}

export const completeItemEndpoint: ApiEndpoint<CompleteItemRequest, CompleteItemResponse> = {
    path: '/api/items/:itemId/complete',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = completeItemSchema.parse(req.body);
            const itemId = new Types.ObjectId(req.params.itemId);
            const item = await ItemManager.getInstance().setCompleted(itemId, data.completed);

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
                        completed: item.completed,
                        dueDate: item.dueDate?.toISOString(),
                        notes: item.notes
                    }
                }
            });
        } catch (error) {
            let message = 'Failed to update item completion status';

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