import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { VersionResponse } from "@timothyw/pat-common";

export async function runVersionTest(context: TestContext) {
    const response = await axios.get<ApiResponseBody<VersionResponse>>(
        `${context.baseUrl}/api/version?clientVersion=${0}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!response.data.data!.updateRequired) throw new Error('client should require an update');
}