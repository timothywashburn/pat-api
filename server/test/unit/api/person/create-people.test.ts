import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import {PersonModel} from "../../../../src/models/mongo/person.data";
import { CreatePersonResponse, PersonId } from "@timothyw/pat-common";
import { ApiResponseBody } from "../../../../src/api/types";

export async function runCreatePeopleTest(context: TestContext) {
    const person1Response = await axios.post<ApiResponseBody<CreatePersonResponse>>(
        `${context.baseUrl}/api/people`,
        {
            name: 'Test Person 1',
            properties: [
                { key: 'email', value: 'test1@example.com' }
            ],
            notes: [
                { content: 'Test note 1' },
                { content: 'Test note 2' },
                { content: 'Test note 3' }
            ]
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!person1Response.data.success) throw new Error('failed to create first person');

    const person2Response = await axios.post<ApiResponseBody<CreatePersonResponse>>(
        `${context.baseUrl}/api/people`,
        {
            name: 'Test Person 2'
        },
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!person2Response.data.success) throw new Error('failed to create second person');

    context.personIds = [
        person1Response.data.data!.person.id as PersonId,
        person2Response.data.data!.person.id as PersonId
    ];

    const people = await PersonModel.find({
        userId: new Types.ObjectId(context.userId)
    });

    if (people.length !== 2) throw new Error(`expected 2 people, found ${people.length}`);
}