import axios from 'axios';
import { TestContext } from '../../../main';

interface ItemsResponse {
    success: boolean;
    data: {
        items: Array<{
            id: string;
            name: string;
            completed: boolean;
            dueDate?: string;
            notes?: string;
        }>;
    };
    error?: string;
}

export async function runGetItemsTest(context: TestContext) {
    const response = await axios.get<ItemsResponse>(
        `${context.baseUrl}/api/items?userId=${context.userId}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to fetch items');
    if (!Array.isArray(response.data.data.items)) throw new Error('invalid items response format');

    if (response.data.data.items.length != 1) throw new Error(`expected 1 items, found ${response.data.data.items.length}`)
}