import { TestContext } from '../../../main';
import { GetListsResponse, Serializer } from "@timothyw/pat-common";
import { get } from "../../../test-utils";

export async function runGetListsTest(context: TestContext) {
    const response = await get<{}, GetListsResponse>(
        context,
        "/api/lists"
    );

    if (!response.success) {
        throw new Error('Failed to get lists');
    }

    const lists = response.lists.map(list => Serializer.deserializeListData(list));

    if (context.listIds && lists.length !== context.listIds.length) {
        const count = context.listIds.length;
        throw new Error(`Expected ${count}  list${count == 1 ? '' : 's'}, got ${lists.length}`);
    }
}
