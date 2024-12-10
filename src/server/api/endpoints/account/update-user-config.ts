import { ApiEndpoint } from '../../types';
import UserManager from '../../../controllers/user-manager';
import { z } from 'zod';

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
    taskListTracking: z.object({
        channelId: z.string(),
        messageId: z.string()
    }).nullish(),
    iosApp: z.object({
        panels: z.array(z.object({
            panel: z.enum(['agenda', 'tasks', 'inbox', 'settings']),
            visible: z.boolean()
        })).optional(),
        taskCategories: z.array(z.string()).optional(),
        taskTypes: z.array(z.string()).optional()
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
            const updatedUser = await UserManager.getInstance().update(userId, data);

            if (!updatedUser) {
                res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
                return
            }

            const formattedIosApp = updatedUser.iosApp ? {
                panels: updatedUser.iosApp.panels.map(p => ({
                    panel: p.type?.panel || 'agenda',
                    visible: p.type?.visible || false
                })),
                taskCategories: updatedUser.iosApp.taskCategories,
                taskTypes: updatedUser.iosApp.taskTypes
            } : undefined;

            res.json({
                success: true,
                data: {
                    user: {
                        id: updatedUser._id.toString(),
                        name: updatedUser.name,
                        timezone: updatedUser.timezone,
                        discordID: updatedUser.discordID,
                        taskListTracking: updatedUser.taskListTracking,
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
            })
        }
    }
}