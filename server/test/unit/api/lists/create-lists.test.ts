import { TestContext } from '../../../main';
import { ListModel } from "../../../../src/models/mongo/list-data";
import {
    CreateListResponse,
    Serializer,
    ListType,
    CreateListRequest
} from "@timothyw/pat-common";
import { post } from "../../../test-utils";

export async function runCreateListsTest(context: TestContext) {
    await createList(context, { name: 'List 1 (to update later)', type: ListType.TASKS });
    await createList(context, { name: 'List 2', type: ListType.NOTES });
    await createList(context, { name: 'List to delete', type: ListType.TASKS });

    const lists = await ListModel.find({
        userId: context.userId
    });

    if (lists.length !== context.listIds.length)
        throw new Error(`expected ${context.listIds.length} list${context.listIds.length === 1 ? "" : "s"}, found ${lists.length}`);
}

async function createList(context: TestContext, data: CreateListRequest) {
    const response = await post<CreateListRequest, CreateListResponse>(
        context,
        "/api/lists",
        { ...data }
    );

    if (!response.success) throw new Error(`failed to create list: ${data.name}`);
    const list = Serializer.deserializeListData(response.list);
    context.listIds.push(list._id);
}
