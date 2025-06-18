import { ApiEndpoint } from '../../types';
import { VersionQuery, VersionResponse } from "@timothyw/pat-common";

const MINIMUM_CLIENT_VERSION = 2;

export const versionEndpoint: ApiEndpoint<undefined, VersionResponse> = {
    path: '/api/version',
    method: 'get',
    handler: async (req, res) => {
        const { clientVersion } = req.query as VersionQuery;

        if (!clientVersion) {
            res.json({
                success: false,
                error: 'Please specify a client version'
            })
            return;
        }

        res.json({
            success: true,
            data: {
                serverVersion: 0,
                minClientVersion: MINIMUM_CLIENT_VERSION,
                updateRequired: clientVersion < MINIMUM_CLIENT_VERSION
            }
        });
    }
};