import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import { PersonModel } from "../../../../src/models/mongo/person-data";
import { ApiResponseBody } from "../../../../src/api/types";
import { DeletePersonResponse } from "@timothyw/pat-common";

export async function runDeletePersonTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.personIds) {
        throw new Error('missing required context for delete test');
    }

    const deleteId = context.personIds.pop();

    const deleteResponse = await axios.delete<ApiResponseBody<DeletePersonResponse>>(
        `${context.baseUrl}/api/people/${deleteId}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!deleteResponse.data.success) throw new Error('failed to delete person');

    for (let i = 0; i < context.personIds.length; i++) {
        const person = await PersonModel.findOne({
            _id: context.personIds[i],
            userId: context.userId
        });

        if (!person) throw new Error(`person with id ${context.personIds[i]} not found`);
    }
}
