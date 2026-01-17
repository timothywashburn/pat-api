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
            const userId = req.patAuth!.userId!;

            if (data.synced) {
                // enable sync: delete individual templates and inherit from parent
                await NotificationTemplateManager.enableEntitySync(userId, data.entityType, data.entityId);

                res.json({
                    success: true,
                    synced: true,
                });
            } else {
                // break sync: copy parent templates as individual templates
                await NotificationTemplateManager.breakEntitySync(userId, data.entityType, data.entityId);

                res.json({
                    success: true,
                    synced: false,
                });
            }

            // regardless, reschedule notifications for this entity
            const entityData = await NotificationTemplateManager.getEntityData(userId, data.entityType, data.entityId);
            await NotificationTemplateManager.removeAllForEntity(userId, data.entityType, data.entityType);
            await NotificationTemplateManager.onNewEntity(userId, data.entityType, data.entityType, entityData);
        } catch (error) {
            console.error('Error updating entity sync:', error);

            let message = 'Failed to update entity sync';
            let status = 500;

            if (error instanceof z.ZodError) {
                message = error.issues[0].message;
                status = 400;
            }

            res.status(status).json({
                success: false,
                error: message
            });
        }
    }
};