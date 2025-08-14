import { TestContext } from '../../../main';
import { ListItemModel } from "../../../../src/models/mongo/list-item-data";
import { CreateListItemRequest, CreateListItemResponse, Serializer } from "@timothyw/pat-common";
import { post } from "../../../test-utils";

export async function runCreateListItemsTest(context: TestContext) {
    if (!context.listIds || context.listIds.length === 0) {
        throw new Error('No lists available');
    }

    await createListItem(context, {
        name: 'Item 1 (to update later)',
        notes: 'This notes text should get changed',
        listId: context.listIds[0]
    });

    await createListItem(context, {
        name: 'Item 2',
        notes: 'Second item for testing',
        listId: context.listIds[0]
    });

    await createListItem(context, {
        name: 'Item to delete',
        notes: 'This item will be deleted',
        listId: context.listIds[0]
    });

    const listItems = await ListItemModel.find({
        userId: context.userId
    });

    if (listItems.length !== context.listIds.length)
        throw new Error(`expected ${context.listIds.length} list item${context.listIds.length === 1 ? "" : "s"}, found ${listItems.length}`);
}

async function createListItem(context: TestContext, data: CreateListItemRequest) {
    const response = await post<CreateListItemRequest, CreateListItemResponse>(
        context,
        '/api/list-items',
        { ...data }
    );

    if (!response.success) throw new Error(`failed to create list item: ${data.name}`);
    const listItem = Serializer.deserializeListItemData(response.listItem);
    context.listItemIds.push(listItem._id);
}
