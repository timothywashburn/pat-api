import { ApiEndpoint } from '../../types';
import UserManager from '../../../controllers/user-manager';
import ItemManager from '../../../controllers/item-manager';
import { z } from 'zod';
import {Types} from "mongoose";
import {PANEL_TYPES} from "../../../models/panels";

const updateUserConfigSchema = z.object({
    name: z.string().min(1).nullish(),
    timezone: z.string()
        .refine((tz: string) => {
            try {
                Intl.DateTimeFormat(undefined, { timeZone: tz });
                return true;
            } catch (e) {
                return false;
            }
        }, {
            message: "Invalid timezone"
        })
        .nullish(),
    discordID: z.string().nullish(),
    itemListTracking: z.object({
        channelId: z.string(),
        messageId: z.string()
    }).nullish(),
    iosApp: z.object({
        panels: z.array(z.object({
            panel: z.enum(PANEL_TYPES),
            visible: z.boolean()
        })).optional(),
        itemCategories: z.array(z.string()).optional(),
        itemTypes: z.array(z.string()).optional(),
        propertyKeys: z.array(z.string()).optional()
    }).nullish()
}).strict();

export type UpdateUserConfigRequest = z.infer<typeof updateUserConfigSchema>;

export interface UpdateUserConfigResponse {
    user: UpdateUserConfigRequest & {
        id: string;
    };
}

export const updateUserConfigEndpoint: ApiEndpoint<UpdateUserConfigRequest, UpdateUserConfigResponse> = {
    path: '/api/account/config',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data: UpdateUserConfigRequest = updateUserConfigSchema.parse(req.body);
            const userId = req.auth!.userId!;

            const currentUser = await UserManager.getInstance().getById(userId);
            if (!currentUser) {
                res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
                return;
            }

            if (data.iosApp?.itemCategories !== undefined) {
                const removedCategories = (currentUser.iosApp?.itemCategories || [])
                    .filter(cat => !data.iosApp!.itemCategories!.includes(cat));

                for (const category of removedCategories) {
                    await ItemManager.getInstance().clearItemCategory(
                        new Types.ObjectId(userId),
                        category
                    );
                }
            }

            if (data.iosApp?.itemTypes !== undefined) {
                const removedTypes = (currentUser.iosApp?.itemTypes || [])
                    .filter(type => !data.iosApp!.itemTypes!.includes(type));

                for (const type of removedTypes) {
                    await ItemManager.getInstance().clearItemType(
                        new Types.ObjectId(userId),
                        type
                    );
                }
            }

            const updatedUser = await UserManager.getInstance().update(userId, data);
            if (!updatedUser) {
                res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
                return;
            }

            const formattedIosApp = updatedUser.iosApp ? {
                panels: updatedUser.iosApp.panels.map(panel => ({
                    panel: panel.type?.panel!,
                    visible: panel.type?.visible!
                })),
                itemCategories: updatedUser.iosApp.itemCategories,
                itemTypes: updatedUser.iosApp.itemTypes,
                propertyKeys: updatedUser.iosApp.propertyKeys
            } : undefined;

            res.json({
                success: true,
                data: {
                    user: {
                        id: updatedUser._id.toString(),
                        name: updatedUser.name,
                        timezone: updatedUser.timezone,
                        discordID: updatedUser.discordID,
                        itemListTracking: updatedUser.itemListTracking,
                        iosApp: formattedIosApp
                    }
                }
            });
        } catch (error) {
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