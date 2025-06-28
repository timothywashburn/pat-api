import axios from 'axios';
import { TestContext } from '../../../main';
import { ApiResponseBody } from "../../../../src/api/types";
import { VersionResponse } from "@timothyw/pat-common";

export async function runVersionTest(context: TestContext) {
    // Test iOS with build version 0 (should require update)
    const iOSResponse = await axios.get<ApiResponseBody<VersionResponse>>(
        `${context.baseUrl}/api/version?iOSBuildVersion=0`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!iOSResponse.data.data!.updateRequired) throw new Error('iOS client should require an update');
    if (!iOSResponse.data.data!.minIOSBuildVersion) throw new Error('response should include minIOSBuildVersion');
    if (!iOSResponse.data.data!.minAndroidBuildVersion) throw new Error('response should include minAndroidBuildVersion');

    // Test Android with build version 0 (should require update)
    const androidResponse = await axios.get<ApiResponseBody<VersionResponse>>(
        `${context.baseUrl}/api/version?androidBuildVersion=0`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!androidResponse.data.data!.updateRequired) throw new Error('Android client should require an update');
}