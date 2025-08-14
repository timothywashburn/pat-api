import { TestContext } from '../../../main';
import { ListItemModel } from "../../../../src/models/mongo/list-item-data";
import { UpdateListItemResponse } from "@timothyw/pat-common";
import { put } from "../../../test-utils";

export async function runUpdateListItemTest(context: TestContext) {
    if (!context.listItemIds || context.listItemIds.length === 0) {
        throw new Error('No list items available for update test');
    }

    const listItemId = context.listItemIds[0];

    const updates = {
        name: 'Updated list item name',
        notes: 'Updated list item notes'
    };

    const response = await put<typeof updates, UpdateListItemResponse>(
        context,
        `/api/list-items/${listItemId}`,
        updates
    );

    if (!response.success) throw new Error('Failed to update list-items');

    const updatedListItem = response.listItem;
    if (updatedListItem.name !== updates.name) throw new Error('List item name was not updated correctly');
    if (updatedListItem.notes !== updates.notes) throw new Error('List item notes were not updated correctly');
    const listItemInDb = await ListItemModel.findById(listItemId);
    if (!listItemInDb || listItemInDb.name !== updates.name) {
        throw new Error('List item not properly updated in database');
    }
}
