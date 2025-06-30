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
        notes: 'Description for second item',
        dueDate: new Date(Date.now() + 60 * 60 * 1000 + 10 * 1000),
        category: 'Category 1',
        type: 'Type 2',
        urgent: true
    });

    await createItem(context, {
        name: 'Third item',
        notes: 'Description for third item',
        category: 'Category 2',
        urgent: true
    });

    await createItem(context, {
        name: 'Fourth item',
        notes: 'Description for fourth item',
        dueDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
        category: 'Category 1',
        type: 'Type 1',
    });

    for (let i = 0; i < 15; i++) {
        await createItem(context, {
            name: `Spam ${i + 1}`,
            notes: `Description for item ${i + 1}`,
            dueDate: new Date(Date.now() + (i + 100) * 24 * 60 * 60 * 1000),
            category: `Category ${i % 3 + 1}`,
            type: `Type ${i % 2 + 1}`
        });
    }

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
    context.itemIds.push(response.data.data!.item._id as ItemId);
}