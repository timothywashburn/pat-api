import { TestContext } from '../../../main';
import { ListItemModel } from "../../../../src/models/mongo/list-item-data";
import { CompleteListItemResponse } from "@timothyw/pat-common";
import { put } from "../../../test-utils";

export async function runCompleteListItemTest(context: TestContext) {
    if (!context.listItemIds || context.listItemIds.length === 0) {
        throw new Error('No list items available for completion test');
    }

    const listItemId = context.listItemIds[0];

    const response = await put<{ completed: boolean }, CompleteListItemResponse>(
        context,
        `/api/list-items/${listItemId}/complete`,
        {
            completed: true
        }
    );

    if (!response.success) {
        throw new Error('Failed to complete list item');
    }

    const completedListItem = response.listItem;

    if (!completedListItem.completed) {
        throw new Error('List item should be marked as completed');
    }

    // Verify in database
    const listItemInDb = await ListItemModel.findById(listItemId).lean();
    if (!listItemInDb || !listItemInDb.completed) {
        throw new Error('List item not properly marked as completed in database');
    }

    const uncompleteResponse = await put<{ completed: boolean }, CompleteListItemResponse>(
        context,
        `/api/list-items/${listItemId}/complete`,
        {
            completed: false
        }
    );

    if (!uncompleteResponse.success) {
        throw new Error('Failed to uncomplete list item');
    }

    const uncompletedListItem = uncompleteResponse.listItem;

    if (uncompletedListItem.completed) {
        throw new Error('List item should be marked as not completed');
    }
}