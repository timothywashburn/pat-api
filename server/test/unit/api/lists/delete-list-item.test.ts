import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import { ListItemModel } from "../../../../src/models/mongo/list-item-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { del } from "../../../test-utils";

export async function runDeleteListItemTest(context: TestContext) {
    if (!context.listItemIds || context.listItemIds.length < 2) {
        throw new Error('Need at least 2 list items for delete test');
    }

    const deleteId = context.listItemIds.pop();

    const response = await del<{ success: boolean }>(
        context,
        `/api/list-items/${deleteId}`
    );

    if (!response.success) {
        throw new Error('Failed to delete list item');
    }

    const listItemInDb = await ListItemModel.findById(deleteId);
    if (listItemInDb) {
        throw new Error('List item should have been deleted from database');
    }

    for (let i = 0; i < context.listItemIds.length; i++) {
        const listItem = await ListItemModel.findOne({
            _id: context.listItemIds[i],
            userId: context.userId
        });

        if (!listItem) throw new Error(`List item with id ${context.listItemIds[i]} not found`);
    }
}
