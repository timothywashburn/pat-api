import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import { PersonModel } from "../../../../src/models/mongo/person.data";
import { CreatePersonResponse, PersonId } from "@timothyw/pat-common";
import { ApiResponseBody } from "../../../../src/api/types";

export async function runCreatePeopleTest(context: TestContext) {
    await createPerson(context, {
        name: 'Person to update (name and notes should change)',
        properties: [
            { key: 'email', value: 'old-email@example.com' }
        ],
        notes: [
            { content: 'Old note 1' },
            { content: 'Old note 2' }
        ]
    });

    await createPerson(context, {
        name: 'Second Person'
    });

    await createPerson(context, {
        name: 'To Delete'
    });

    const people = await PersonModel.find({
        userId: new Types.ObjectId(context.userId)
    });

    if (people.length !== context.personIds.length)
        throw new Error(`expected ${context.personIds.length == 1 ? "1 person" : context.personIds.length + " people"}, found ${people.length}`);
}

async function createPerson(context: TestContext, data: Record<string, any>) {
    const response = await axios.post<ApiResponseBody<CreatePersonResponse>>(
        `${context.baseUrl}/api/people`,
        { ...data },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.success) throw new Error(`failed to create person: ${data.name}`);
    context.personIds.push(response.data.data!.person.id as PersonId);
}