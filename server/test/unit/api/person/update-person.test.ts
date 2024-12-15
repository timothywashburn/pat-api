import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import {PersonModel} from "../../../../src/models/mongo/person.data";

interface UpdatePersonResponse {
    success: boolean;
    data: {
        person: {
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
            }>;
        };
    };
    error?: string;
}

export async function runUpdatePersonTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.personIds) {
        throw new Error('missing required context for update person test');
    }

    const updates = {
        name: 'Updated Person Name',
        properties: [
            { key: 'email', value: 'updated@example.com', order: 0 },
            { key: 'phone', value: '123-456-7890', order: 1 }
        ],
        notes: [
            { content: 'Updated test note', order: 0 }
        ]
    };

    const updateResponse = await axios.put<UpdatePersonResponse>(
        `${context.baseUrl}/api/people/${context.personIds[0]}`,
        updates,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!updateResponse.data.success) throw new Error('failed to update person');
    if (updateResponse.data.data.person.name !== updates.name) throw new Error('name not updated in response');

    const person = await PersonModel.findById(new Types.ObjectId(context.personIds[0]));
    if (!person) throw new Error('person not found in database');
    if (person.name !== updates.name) throw new Error('name not updated in database');
    if (person.properties.length !== updates.properties.length) throw new Error('properties not updated correctly');
    if (person.notes.length !== updates.notes.length) throw new Error('notes not updated correctly');
}