import { ApiEndpoint } from '../../types';
import NotificationTemplateManager from '../../../controllers/notification-template-manager';
import {
    GetEntitySyncRequest,
    GetEntitySyncResponse,
    getEntitySyncRequestSchema,
    NotificationEntityType
} from "@timothyw/pat-common";
import { z } from 'zod';

export const getEntitySyncEndpoint: ApiEndpoint<GetEntitySyncRequest, GetEntitySyncResponse> = {
    path: '/api/notifications/entity-sync',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = getEntitySyncRequestSchema.parse(req.query);
            const userId = req.auth!.userId!;

            const synced = await NotificationTemplateManager.getEntitySyncState(userId, data.targetEntityType, data.targetId);
            
            res.json({
                success: true,
                synced
            });
        } catch (error) {
            console.error('Error getting entity sync state:', error);
            
            let message = 'Failed to get entity sync state';
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