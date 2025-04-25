import { ApiEndpoint } from '../../types';
import UserManager from '../../../controllers/user-manager';
import { Document } from 'mongoose';
import { GetUserConfigResponse, Panel, PANEL_TYPES } from "@timothyw/pat-common";

const isValidPanel = (panel: Panel | null | undefined): panel is Panel => {
    return panel != null && PANEL_TYPES.includes(panel.type);
};

export const getUserConfigEndpoint: ApiEndpoint<undefined, GetUserConfigResponse> = {
    path: '/api/account/config',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const user = await UserManager.getInstance().getById(req.auth!.userId!);

            if (!user) {
                res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
                return;
            }

            if (!user.iosApp?.panels) {
                res.status(500).json({
                    success: false,
                    error: 'No panel configuration found'
                });
                return;
            }

            console.log(user.iosApp.panels);
            const transformedPanels = user.iosApp.panels.map(panel => {
                if (!isValidPanel(panel)) {
                    return null;
                }
                return {
                    type: panel.type,
                    visible: panel.visible ?? true
                };
            }).filter((p): p is Panel => p !== null);
            console.log("transformed");
            console.log(transformedPanels);

            if (transformedPanels.length === 0) {
                res.status(500).json({
                    success: false,
                    error: 'No valid panel configuration found'
                });
                return;
            }

            const responseData: GetUserConfigResponse = {
                user
            };

            res.json({
                success: true,
                data: responseData
            });
        } catch (error) {
            console.error('[config] Error in getUserConfig:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user configuration'
            });
        }
    }
};