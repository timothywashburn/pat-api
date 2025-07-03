import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetItemsResponse, Serializer } from "@timothyw/pat-common";

export async function runGetItemsTest(context: TestContext) {
    const response = await axios.get<ApiResponseBody<GetItemsResponse>>(
        `${context.baseUrl}/api/items`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to fetch items');
    if (!Array.isArray(response.data.data!.items)) throw new Error('invalid items response format');
    
    const items = response.data.data!.items.map(i => Serializer.deserializeItemData(i));
    if (items.length != context.itemIds.length)
        throw new Error(`expected ${context.itemIds.length} item${context.itemIds.length == 1 ? "" : "s"}, found ${items.length}`)
}