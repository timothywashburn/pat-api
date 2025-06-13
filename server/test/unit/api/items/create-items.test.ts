import axios from 'axios';
import { TestContext } from '../../../main';
import { ItemModel } from "../../../../src/models/mongo/item-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { CreateItemResponse, ItemId } from "@timothyw/pat-common";

export async function runCreateItemsTest(context: TestContext) {
    await createItem(context, {
        name: 'First item (to update)',
        notes: 'This description should get changed',
    });

    await createItem(context, {
        name: 'Second item',
        notes: 'Second item for testing',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 + 1000 * 30),
    });

    await createItem(context, {
        name: 'To delete item',
        notes: 'This item should get deleted',
    });

    const items = await ItemModel.find({
        userId: context.userId
    });

    if (items.length !== context.itemIds.length)
        throw new Error(`expected ${context.itemIds.length} item${context.itemIds.length === 1 ? "" : "s"}, found ${items.length}`);
}

async function createItem(context: TestContext, data: Record<string, any>) {
    const response = await axios.post<ApiResponseBody<CreateItemResponse>>(
        `${context.baseUrl}/api/items`,
        {
            ...data,
            userId: context.userId
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error(`failed to create item: ${data.name}`);
    context.itemIds.push(response.data.data!.item.id as ItemId);
}