import { ApiEndpoint } from '../../types';
import { VersionQuery, VersionResponse } from "@timothyw/pat-common";
import ConfigManager from '../../../controllers/config-manager';

export const versionEndpoint: ApiEndpoint<undefined, VersionResponse> = {
    path: '/api/version',
    method: 'get',
    handler: async (req, res) => {
        const { iOSBuildVersion, androidBuildVersion } = req.query as VersionQuery;

        if (!iOSBuildVersion && !androidBuildVersion) {
            res.json({
                success: false,
                error: 'Please specify either iOSBuildVersion or androidBuildVersion'
            });
            return;
        }

        if (iOSBuildVersion && (isNaN(Number(iOSBuildVersion)) || Number(iOSBuildVersion) < 0)) {
            res.json({
                success: false,
                error: 'iOSBuildVersion must be a valid positive number'
            });
            return;
        }

        if (androidBuildVersion && (isNaN(Number(androidBuildVersion)) || Number(androidBuildVersion) < 0)) {
            res.json({
                success: false,
                error: 'androidBuildVersion must be a valid positive number'
            });
            return;
        }

        const config = ConfigManager.getConfig();
        const minIOSBuildVersion = config._requiredBuildVersions.iOS;
        const minAndroidBuildVersion = config._requiredBuildVersions.android;

        console.log(`Checking version: iOS ${iOSBuildVersion}; min iOS ${minIOSBuildVersion}, needs update: ${iOSBuildVersion && iOSBuildVersion < minIOSBuildVersion}`);

        let updateRequired = false;
        if (iOSBuildVersion && iOSBuildVersion < minIOSBuildVersion) updateRequired = true;
        if (androidBuildVersion && androidBuildVersion < minAndroidBuildVersion) updateRequired = true;

        res.json({
            success: true,
            data: {
                minIOSBuildVersion,
                minAndroidBuildVersion,
                updateRequired
            }
        });
    }
};