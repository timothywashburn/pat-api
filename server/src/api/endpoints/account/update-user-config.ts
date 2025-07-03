import { ApiEndpoint } from '../../types';
import UserManager from '../../../controllers/user-manager';
import ItemManager from '../../../controllers/item-manager';
import { z } from 'zod';
import { Serializer, UpdateUserRequest, updateUserRequestSchema, UpdateUserResponse } from "@timothyw/pat-common";

export const updateUserEndpoint: ApiEndpoint<UpdateUserRequest, UpdateUserResponse> = {
    path: '/api/account',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data: UpdateUserRequest = updateUserRequestSchema.parse(req.body);
            const userId = req.auth!.userId!;

            console.log('[config] updating user config for userId:', userId);

            const currentUser = await UserManager.getInstance().getById(userId);
            if (!currentUser) {
                res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
                return;
            }

            console.log('[config] current user config:', currentUser.config);

            if (data.config?.agenda?.itemCategories !== undefined) {
                const removedCategories = (currentUser.config.agenda.itemCategories || [])
                    .filter(cat => !data.config!.agenda!.itemCategories!.includes(cat));

                for (const category of removedCategories) {
                    await ItemManager.getInstance().clearItemCategory(
                        userId,
                        category
                    );
                }
            }

            if (data.config?.agenda?.itemTypes !== undefined) {
                const removedTypes = (currentUser.config.agenda.itemTypes || [])
                    .filter(type => !data.config!.agenda!.itemTypes!.includes(type));

                for (const type of removedTypes) {
                    await ItemManager.getInstance().clearItemType(
                        userId,
                        type
                    );
                }
            }

            console.log('[config] applying new config:', data.config);

            const updatedUser = await UserManager.getInstance().update(req.auth!, userId, data);
            if (!updatedUser) {
                res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
                return;
            }

            console.log('[config] updated user config:', updatedUser.config);

            res.json({
                success: true,
                data: {
                    user: Serializer.serializeUserData(updatedUser)
                }
            });
        } catch (error) {
            console.error('[config] error updating user config:', error);
            let message = 'Failed to update user configuration';

            if (error instanceof z.ZodError) {
                console.log('[config] validation error:', error.errors);
                message = error.errors[0].message;
            } else {
                console.error('[config] unexpected error:', error);
            }

            res.status(400).json({
                success: false,
                error: message
            });
        }
    }
};