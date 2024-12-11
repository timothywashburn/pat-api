import axios from 'axios';
import { TestContext } from '../../main';
import { Types } from 'mongoose';
import {ItemModel} from "../../../src/server/models/mongo/item-data";

interface DeleteItemResponse {
    success: boolean;
    data: {
        deleted: boolean;
    };
    error?: string;
}

export async function runDeleteItemTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.itemIds) {
        throw new Error('missing required context for delete test');
    }

    const deleteResponse = await axios.delete<DeleteItemResponse>(
        `${context.baseUrl}/api/items/${context.itemIds[0]}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!deleteResponse.data.success) throw new Error('failed to delete item');

    const items = await ItemModel.find({
        userId: new Types.ObjectId(context.userId)
    });

    if (items.length !== 1) throw new Error(`expected 1 remaining item, found ${items.length}`);
    if (items[0]._id.toString() !== context.itemIds[1]) throw new Error('wrong item was deleted');
}