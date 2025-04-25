import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import {ItemModel} from "../../../../src/models/mongo/item-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { DeleteItemResponse } from "@timothyw/pat-common";

export async function runDeleteItemTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.itemIds) {
        throw new Error('missing required context for delete test');
    }

    const deleteResponse = await axios.delete<ApiResponseBody<DeleteItemResponse>>(
        `${context.baseUrl}/api/items/${context.itemIds[0]}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!deleteResponse.data.success) throw new Error('failed to delete item');

    const items = await ItemModel.find({
        userId: context.userId
    });

    if (items.length !== 1) throw new Error(`expected 1 remaining item, found ${items.length}`);
    if (items[0]._id.toString() !== context.itemIds[1]) throw new Error('wrong item was deleted');
}