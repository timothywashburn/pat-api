import { ApiEndpoint } from '../../types';
import UserManager from '../../../controllers/user-manager';
import { GetUserResponse, Panel, PanelType } from "@timothyw/pat-common";

const isValidPanel = (panel: Panel | null | undefined): panel is Panel => {
    return panel != null && Object.values(PanelType).includes(panel.type);
};

export const getUserEndpoint: ApiEndpoint<undefined, GetUserResponse> = {
    path: '/api/account',
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

            if (!user.config.panels) {
                res.status(500).json({
                    success: false,
                    error: 'No panel configuration found'
                });
                return;
            }

            const transformedPanels = user.config.panels.map(panel => {
                if (!isValidPanel(panel)) {
                    return null;
                }
                return {
                    type: panel.type,
                    visible: panel.visible ?? true
                };
            }).filter((p): p is Panel => p !== null);

            if (transformedPanels.length === 0) {
                res.status(500).json({
                    success: false,
                    error: 'No valid panel configuration found'
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    user
                }
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