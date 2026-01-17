import { TestContext } from '../../../main';
import { ItemModel } from '../../../../src/models/mongo/item-data';
import { UpdateAgendaItemResponse } from "@timothyw/pat-common";
import { put } from "../../../test-utils";

export async function runUpdateItemTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.itemIds) {
        throw new Error('missing required context for update item test');
    }

    const updates = {
        name: 'First Item',
        notes: 'New item description worked!'
    };

    const updateResponse = await put<typeof updates, UpdateAgendaItemResponse>(
        context,
        `/api/items/${context.itemIds[0]}`,
        updates
    );

    if (!updateResponse.success) throw new Error('failed to update item');
    if (updateResponse.agendaItem.name !== updates.name) throw new Error('name not updated in response');
    if (updateResponse.agendaItem.notes !== updates.notes) throw new Error('notes not updated in response');

    const item = await ItemModel.findById(context.itemIds[0]);
    if (!item) throw new Error('item not found in database');
    if (item.name !== updates.name) throw new Error('name not updated in database');
    if (item.notes !== updates.notes) throw new Error('notes not updated in database');
}