import axios from 'axios';
import { TestContext } from '../../../main';
import { ItemModel } from '../../../../src/models/mongo/item-data';
import { Types } from 'mongoose';
import { CompleteItemResponse, DeleteItemResponse } from "@timothyw/pat-common";
import { ApiResponseBody } from "../../../../src/api/types";

export async function runCompleteItemTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.itemIds) {
        throw new Error('missing required context for complete item test');
    }

    const completeResponse = await axios.put<ApiResponseBody<CompleteItemResponse>>(
        `${context.baseUrl}/api/items/${context.itemIds[1]}/complete`,
        { completed: true },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!completeResponse.data.success) throw new Error('failed to complete item');
    if (!completeResponse.data.data!.item.completed) throw new Error('item not marked as completed');

    const item = await ItemModel.findById(context.itemIds[1]);
    if (!item) throw new Error('item not found in database');
    if (!item.completed) throw new Error('item not marked as completed in database');

    const uncompleteResponse = await axios.put<ApiResponseBody<CompleteItemResponse>>(
        `${context.baseUrl}/api/items/${context.itemIds[1]}/complete`,
        { completed: false },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!uncompleteResponse.data.success) throw new Error('failed to uncomplete item');
    if (uncompleteResponse.data.data!.item.completed) throw new Error('item not marked as uncompleted');

    const updatedItem = await ItemModel.findById(new Types.ObjectId(context.itemIds[1]));
    if (!updatedItem) throw new Error('item not found in database');
    if (updatedItem.completed) throw new Error('item not marked as uncompleted in database');
}