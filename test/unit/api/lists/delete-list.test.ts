import { TestContext } from '../../../main';
import { ListModel } from "../../../../src/models/mongo/list-data";
import { ListItemModel } from "../../../../src/models/mongo/list-item-data";
import { del } from "../../../test-utils";

export async function runDeleteListTest(context: TestContext) {
    if (!context.listIds || context.listIds.length < 2) {
        throw new Error('Need at least 2 lists for delete test');
    }

    const deleteId = context.listIds.pop();

    const response = await del<{ success: boolean }>(
        context,
        `/api/lists/${deleteId}`
    );

    if (!response.success) throw new Error('Failed to delete list');

    const listInDb = await ListModel.findById(deleteId);
    if (listInDb) {
        throw new Error('List should have been deleted from database');
    }

    const remainingItemsInList = await ListItemModel.find({ taskListId: deleteId });
    if (remainingItemsInList.length > 0) throw new Error('All items in deleted list should also be deleted');

    for (let i = 0; i < context.listIds.length; i++) {
        const list = await ListModel.findOne({
            _id: context.listIds[i],
            userId: context.userId
        });

        if (!list) throw new Error(`List with id ${context.listIds[i]} not found`);
    }
}
