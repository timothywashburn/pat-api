import { TestContext } from '../../../main';
import {ItemModel} from "../../../../src/models/mongo/item-data";
import { DeleteAgendaItemResponse } from "@timothyw/pat-common";
import { del } from "../../../test-utils";

export async function runDeleteItemTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.itemIds) {
        throw new Error('missing required context for delete test');
    }

    const deleteId = context.itemIds.pop();

    const deleteResponse = await del<DeleteAgendaItemResponse>(
        context,
        `/api/items/${deleteId}`
    );

    if (!deleteResponse.success) throw new Error('failed to delete item');

    for (let i = 0; i < context.itemIds.length; i++) {
        const item = await ItemModel.findOne({
            _id: context.itemIds[i],
            userId: context.userId
        });

        if (!item) throw new Error(`item with id ${context.itemIds[i]} not found`);
    }
}