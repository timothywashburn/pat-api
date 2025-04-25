import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import {ItemModel} from "../../../../src/models/mongo/item-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { CreateItemResponse, ItemId } from "@timothyw/pat-common";

export async function runCreateItemsTest(context: TestContext) {
    const item1Response = await axios.post<ApiResponseBody<CreateItemResponse>>(
        `${context.baseUrl}/api/items`,
        {
            name: 'First test item',
            userId: context.userId,
            notes: 'First task for testing'
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!item1Response.data.success) throw new Error('failed to create first item');

    const item2Response = await axios.post<ApiResponseBody<CreateItemResponse>>(
        `${context.baseUrl}/api/items`,
        {
            name: 'Second test item',
            userId: context.userId,
            notes: 'Second item for testing'
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!item2Response.data.success) throw new Error('failed to create second item');

    context.itemIds = [
        item1Response.data.data!.item.id as ItemId,
        item2Response.data.data!.item.id as ItemId
    ];

    const items = await ItemModel.find({
        userId: context.userId
    });

    if (items.length !== 2) {
        throw new Error(`expected 2 items, found ${items.length}`);
    }
}