import { ApiEndpoint } from '../../types';
import NotificationTemplateManager from '../../../controllers/notification-template-manager';
import {
    SetEntitySyncRequest,
    setEntitySyncRequestSchema,
    SetEntitySyncResponse,
} from "@timothyw/pat-common";
import { z } from 'zod';

export const setEntitySyncEndpoint: ApiEndpoint<SetEntitySyncRequest, SetEntitySyncResponse> = {
    path: '/api/notifications/entity-sync',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = setEntitySyncRequestSchema.parse(req.body);
            const userId = req.auth!.userId!;

            if (data.synced) {
                // Enable sync - delete individual templates and inherit from parent
                await NotificationTemplateManager.enableEntitySync(userId, data.targetEntityType, data.targetId);

                res.json({
                    success: true,
                    synced: true,
                });
            } else {
                // Break sync - copy parent templates as individual templates
                await NotificationTemplateManager.breakEntitySync(userId, data.targetEntityType, data.targetId);

                res.json({
                    success: true,
                    synced: false,
                });
            }
        } catch (error) {
            console.error('Error updating entity sync:', error);

            let message = 'Failed to update entity sync';
            let status = 500;

            if (error instanceof z.ZodError) {
                message = error.errors[0].message;
                status = 400;
            }

            res.status(status).json({
                success: false,
                error: message
            });
        }
    }
};