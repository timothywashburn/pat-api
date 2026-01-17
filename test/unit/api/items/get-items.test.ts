import { TestContext } from '../../../main';
import { GetAgendaItemsResponse, AgendaItemData, Serializer } from "@timothyw/pat-common";
import { get } from "../../../test-utils";

export async function runGetItemsTest(context: TestContext) {
    const response = await get<{}, GetAgendaItemsResponse>(
        context,
        "/api/items"
    );

    if (!response.success) throw new Error('failed to fetch items');
    if (!Array.isArray(response.agendaItems)) throw new Error('invalid items response format');
    
    const items = response.agendaItems.map(item => Serializer.deserialize<AgendaItemData>(item));
    if (items.length != context.itemIds.length)
        throw new Error(`expected ${context.itemIds.length} item${context.itemIds.length == 1 ? "" : "s"}, found ${items.length}`)
}