import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import {PersonModel} from "../../../../src/models/mongo/person.data";
import { ApiResponseBody } from "../../../../src/api/types";
import { DeletePersonResponse } from "@timothyw/pat-common";

export async function runDeletePersonTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.personIds) {
        throw new Error('missing required context for delete test');
    }

    const deleteResponse = await axios.delete<ApiResponseBody<DeletePersonResponse>>(
        `${context.baseUrl}/api/people/${context.personIds[1]}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!deleteResponse.data.success) throw new Error('failed to delete person');

    const people = await PersonModel.find({
        userId: new Types.ObjectId(context.userId)
    });

    if (people.length !== 1) throw new Error(`expected 1 remaining person, found ${people.length}`);
    if (people[0]._id.toString() !== context.personIds[0]) throw new Error('wrong person was deleted');
}