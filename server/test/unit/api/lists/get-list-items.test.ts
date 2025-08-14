import { TestContext } from '../../../main';
import { GetListItemsResponse, Serializer } from "@timothyw/pat-common";
import { get } from "../../../test-utils";

export async function runGetListItemsTest(context: TestContext) {
    const response = await get<undefined, GetListItemsResponse>(
        context,
        "/api/list-items"
    );

    if (!response.success) throw new Error('Failed to get list items');
    const listItems = response.listItems.map(t => Serializer.deserializeListItemData(t));

    if (context.listItemIds && listItems.length !== context.listItemIds.length) {
        const count = context.listItemIds.length;
        throw new Error(`Expected ${count} list item${count == 1 ? '' : 's'}, got ${listItems.length}`);
    }
}
