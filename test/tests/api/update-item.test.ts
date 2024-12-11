import axios from 'axios';
import { TestContext } from '../../main';
import { ItemModel } from '../../../src/server/models/mongo/item-data';
import { Types } from 'mongoose';

interface UpdateItemResponse {
    success: boolean;
    data: {
        item: {
            id: string;
            name: string;
            completed: boolean;
            dueDate?: string;
            notes?: string;
        };
    };
    error?: string;
}

export async function runUpdateItemTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.itemIds) {
        throw new Error('missing required context for update item test');
    }

    const updates = {
        name: 'Updated Item Name',
        notes: 'Updated item notes'
    };

    const updateResponse = await axios.put<UpdateItemResponse>(
        `${context.baseUrl}/api/items/${context.itemIds[1]}`,
        updates,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!updateResponse.data.success) throw new Error('failed to update item');
    if (updateResponse.data.data.item.name !== updates.name) throw new Error('name not updated in response');
    if (updateResponse.data.data.item.notes !== updates.notes) throw new Error('notes not updated in response');

    const item = await ItemModel.findById(new Types.ObjectId(context.itemIds[1]));
    if (!item) throw new Error('item not found in database');
    if (item.name !== updates.name) throw new Error('name not updated in database');
    if (item.notes !== updates.notes) throw new Error('notes not updated in database');
}