import axios from 'axios';
import { TestContext } from '../../../main';

interface GetPeopleResponse {
    success: boolean;
    data: {
        people: Array<{
            id: string;
            name: string;
            properties: Array<{
                key: string;
                value: string;
                order: number;
            }>;
            notes: Array<{
                content: string;
                order: number;
                createdAt: string;
                updatedAt: string;
            }>;
        }>;
    };
    error?: string;
}

export async function runGetPeopleTest(context: TestContext) {
    const response = await axios.get<GetPeopleResponse>(
        `${context.baseUrl}/api/people`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error('failed to fetch people');
    if (!Array.isArray(response.data.data.people)) throw new Error('invalid people response format');
    if (response.data.data.people.length !== 1) throw new Error(`expected 1 person, found ${response.data.data.people.length}`);
}