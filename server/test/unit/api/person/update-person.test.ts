import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import { PersonModel } from "../../../../src/models/mongo/person-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { UpdatePersonResponse } from "@timothyw/pat-common";

export async function runUpdatePersonTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.personIds) {
        throw new Error('missing required context for update person test');
    }

    const updates = {
        name: 'First Person',
        properties: [
            { key: 'email', value: 'first@example.com' },
            { key: 'phone', value: '123-456-7890' }
        ],
        notes: [
            { content: 'New test note' },
            { content: 'Another new note' },
            {
                content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
                    'Curabitur sed gravida erat. Fusce a auctor magna. Vivamus eget ' +
                    'diam et mauris pretium auctor. Mauris ac vestibulum erat. Maecenas ac metus enim.'
            }
        ]
    };

    const updateResponse = await axios.put<ApiResponseBody<UpdatePersonResponse>>(
        `${context.baseUrl}/api/people/${context.personIds[0]}`,
        updates,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!updateResponse.data.success) throw new Error('failed to update person');
    if (updateResponse.data.data!.person.name !== updates.name) throw new Error('name not updated in response');

    const person = await PersonModel.findById(new Types.ObjectId(context.personIds[0]));
    if (!person) throw new Error('person not found in database');
    if (person.name !== updates.name) throw new Error('name not updated in database');
    if (person.properties.length !== updates.properties.length) throw new Error('properties not updated correctly');
    if (person.notes.length !== updates.notes.length) throw new Error('notes not updated correctly');
}
