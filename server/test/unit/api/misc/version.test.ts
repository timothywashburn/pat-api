import { TestContext } from '../../../main';
import { isSuccess } from "../../../../src/api/types";
import { VersionResponse } from "@timothyw/pat-common";
import { get } from "../../../test-utils";

export async function runVersionTest(context: TestContext) {
    const iosResponse = await get<any, VersionResponse>(context, '/api/version', {
        iOSBuildVersion: 0
    }, false)

    if (!iosResponse.success) throw new Error(`failed to fetch version: ${iosResponse.error}`);

    if (!iosResponse.updateRequired) throw new Error('iOS client should require an update');
    if (!iosResponse.minIOSBuildVersion) throw new Error('response should include minIOSBuildVersion');
    if (!iosResponse.minAndroidBuildVersion) throw new Error('response should include minAndroidBuildVersion');

    const androidResponse = await get<any, VersionResponse>(context, '/api/version', {
        androidBuildVersion: 0
    });

    if (!isSuccess(androidResponse)) throw new Error(`failed to fetch version: ${androidResponse.error}`);

    if (!androidResponse.updateRequired) throw new Error('Android client should require an update');
}