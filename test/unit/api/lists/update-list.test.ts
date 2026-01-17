import { TestContext } from '../../../main';
import { ListModel } from "../../../../src/models/mongo/list-data";
import { UpdateListResponse } from "@timothyw/pat-common";
import { put } from "../../../test-utils";

export async function runUpdateListTest(context: TestContext) {
    if (!context.listIds || context.listIds.length === 0) {
        throw new Error('No lists available for update test');
    }

    const listId = context.listIds[0];

    const updates = {
        name: 'Updated list name'
    };

    const response = await put<typeof updates, UpdateListResponse>(
        context,
        `/api/lists/${listId}`,
        updates
    );

    if (!response.success) throw new Error('Failed to update list');

    const updatedList = response.list;
    if (updatedList.name !== updates.name) throw new Error('List name was not updated correctly');
    const listInDb = await ListModel.findById(listId);
    if (!listInDb || listInDb.name !== updates.name) throw new Error('List not properly updated in database');
}
