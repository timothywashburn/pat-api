import { ApiEndpoint } from '../../types';
import UserManager from '../../../controllers/user-manager';
import { GetUserResponse, Module, ModuleType } from "@timothyw/pat-common";

const isValidModule = (module: Module | null | undefined): module is Module => {
    return module != null && Object.values(ModuleType).includes(module.type);
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

            if (!user.config.modules) {
                res.status(500).json({
                    success: false,
                    error: 'No module configuration found'
                });
                return;
            }

            const transformedModules = user.config.modules.map(module => {
                if (!isValidModule(module)) {
                    return null;
                }
                return {
                    type: module.type,
                    visible: module.visible ?? true
                };
            }).filter((module): module is Module => module !== null);

            if (transformedModules.length === 0) {
                res.status(500).json({
                    success: false,
                    error: 'No valid module configuration found'
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