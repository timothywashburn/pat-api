import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { GetPeopleResponse, Person, PersonData, Serializer } from "@timothyw/pat-common";
import { get } from "../../../test-utils";

export async function runGetPeopleTest(context: TestContext) {
    const response = await get<{}, GetPeopleResponse>(
        context,
        "/api/people"
    );

    if (!response.success) throw new Error('failed to fetch people');
    if (!Array.isArray(response.people)) throw new Error('invalid people response format');
    
    const people = response.people.map(p => Serializer.deserialize<Person>(p));
    if (context.personIds && people.length !== context.personIds.length) {
        const count = context.personIds.length;
        throw new Error(`expected ${count} ${count == 1 ? 'person' : 'people'}, found ${people.length}`);
    }
}
