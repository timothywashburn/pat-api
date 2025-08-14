import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import { PersonModel } from "../../../../src/models/mongo/person-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { UpdatePersonResponse } from "@timothyw/pat-common";
import { put } from "../../../test-utils";

export async function runUpdatePersonTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.personIds) {
        throw new Error('missing required context for update person test');
    }

    const updates = {
        name: 'First Person',
        properties: [
            { key: 'email', value: 'first@example.com' },
            { key: 'phone', value: '123-456-7890' }
        ]
    };

    const updateResponse = await put<typeof updates, UpdatePersonResponse>(
        context,
        `/api/people/${context.personIds[0]}`,
        updates
    );

    if (!updateResponse.success) throw new Error('failed to update person');
    if (updateResponse.person.name !== updates.name) throw new Error('name not updated in response');

    const person = await PersonModel.findById(context.personIds[0]);
    if (!person) throw new Error('person not found in database');
    if (person.name !== updates.name) throw new Error('name not updated in database');
    if (person.properties.length !== updates.properties.length) throw new Error('properties not updated correctly');
}
