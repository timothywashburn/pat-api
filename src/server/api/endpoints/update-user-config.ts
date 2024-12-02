import { ApiEndpoint } from '../types';
import UserManager from '../../controllers/user-manager';
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
        }))
    }).nullish()
}).strict();

export type UpdateUserConfigRequest = z.infer<typeof updateUserConfigSchema>;

export interface UpdateUserConfigResponse {
    user: UpdateUserConfigRequest & {
        id: string;
    };
}

export const updateUserConfigEndpoint: ApiEndpoint<UpdateUserConfigRequest, UpdateUserConfigResponse> = {
    path: '/api/user/config',
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
                return;
            }

            res.json({
                success: true,
                data: {
                    user: {
                        id: updatedUser._id.toString(),
                        name: updatedUser.name,
                        timezone: updatedUser.timezone,
                        discordID: updatedUser.discordID,
                        taskListTracking: updatedUser.taskListTracking
                    }
                }
            });
        } catch (error) {
            let message = 'Failed to update user configuration';

            if (error instanceof z.ZodError) {
                message = error.errors[0].message;
            }

            res.status(400).json({
                success: false,
                error: message
            });
        }
    }
};