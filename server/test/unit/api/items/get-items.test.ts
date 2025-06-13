import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetItemsResponse } from "@timothyw/pat-common";

export async function runGetItemsTest(context: TestContext) {
    const response = await axios.get<ApiResponseBody<GetItemsResponse>>(
        `${context.baseUrl}/api/items?userId=${context.userId}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to fetch items');
    if (!Array.isArray(response.data.data!.items)) throw new Error('invalid items response format');

    if (response.data.data!.items.length != context.itemIds.length)
        throw new Error(`expected ${context.itemIds.length} item${context.itemIds.length == 1 ? "" : "s"}, found ${response.data.data!.items.length}`)
}