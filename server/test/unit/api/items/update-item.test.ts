import axios from 'axios';
import { TestContext } from '../../../main';
import { ItemModel } from '../../../../src/models/mongo/item-data';
import { ApiResponseBody } from "../../../../src/api/types";
import { UpdateItemResponse } from "@timothyw/pat-common";

export async function runUpdateItemTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.itemIds) {
        throw new Error('missing required context for update item test');
    }

    const updates = {
        name: 'First Item',
        notes: 'New item description worked!'
    };

    const updateResponse = await axios.put<ApiResponseBody<UpdateItemResponse>>(
        `${context.baseUrl}/api/items/${context.itemIds[0]}`,
        updates,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!updateResponse.data.success) throw new Error('failed to update item');
    if (updateResponse.data.data!.item.name !== updates.name) throw new Error('name not updated in response');
    if (updateResponse.data.data!.item.notes !== updates.notes) throw new Error('notes not updated in response');

    const item = await ItemModel.findById(context.itemIds[0]);
    if (!item) throw new Error('item not found in database');
    if (item.name !== updates.name) throw new Error('name not updated in database');
    if (item.notes !== updates.notes) throw new Error('notes not updated in database');
}