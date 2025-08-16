import { TestContext } from '../../../main';
import { ItemModel } from '../../../../src/models/mongo/item-data';
import { CompleteAgendaItemResponse } from "@timothyw/pat-common";
import { put } from "../../../test-utils";

export async function runCompleteItemTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.itemIds) {
        throw new Error('missing required context for complete item test');
    }

    const completeResponse = await put<{ completed: boolean }, CompleteAgendaItemResponse>(
        context,
        `/api/items/${context.itemIds[1]}/complete`,
        { completed: true }
    );

    if (!completeResponse.success) throw new Error('failed to complete item');
    if (!completeResponse.agendaItem.completed) throw new Error('item not marked as completed');

    const item = await ItemModel.findById(context.itemIds[1]);
    if (!item) throw new Error('item not found in database');
    if (!item.completed) throw new Error('item not marked as completed in database');

    const uncompleteResponse = await put<{ completed: boolean }, CompleteAgendaItemResponse>(
        context,
        `/api/items/${context.itemIds[1]}/complete`,
        { completed: false }
    );

    if (!uncompleteResponse.success) throw new Error('failed to uncomplete item');
    if (uncompleteResponse.agendaItem.completed) throw new Error('item not marked as uncompleted');

    const updatedItem = await ItemModel.findById(context.itemIds[1]);
    if (!updatedItem) throw new Error('item not found in database');
    if (updatedItem.completed) throw new Error('item not marked as uncompleted in database');
}