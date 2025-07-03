import { ApiEndpoint } from '../../types';
import UserManager from '../../../controllers/user-manager';
import { GetUserResponse, Module, ModuleType, Serializer } from "@timothyw/pat-common";

const isValidModule = (module: Module | null | undefined): module is Module => {
    return module != null && Object.values(ModuleType).includes(module.type);
};

const ensureCompleteModules = (userModules: Module[]): Module[] => {
    const existingModules = userModules
        .filter(isValidModule)
        .map(module => ({
            type: module.type,
            visible: module.visible ?? true
        }));

    const existingTypes = new Set(existingModules.map(m => m.type));
    const missingModules = Object.values(ModuleType)
        .filter(type => !existingTypes.has(type))
        .map(type => ({ type, visible: true }));

    return [...existingModules, ...missingModules];
};

export const getUserEndpoint: ApiEndpoint<undefined, GetUserResponse> = {
    path: '/api/account',
    method: 'get',
    auth: 'authenticated',
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

            const completeModules = ensureCompleteModules(user.config.modules);

            if (completeModules.length === 0) {
                res.status(500).json({
                    success: false,
                    error: 'No valid module configuration found'
                });
                return;
            }

            user.config.modules = completeModules;

            res.json({
                success: true,
                data: {
                    user: Serializer.serializeUserData(user)
                }
            });
        } catch (error) {
            console.error('[config] error in getUserConfig:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user configuration'
            });
        }
    }
};