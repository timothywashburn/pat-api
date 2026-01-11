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
            const userId = req.patAuth!.userId!;

            const syncState = await NotificationTemplateManager.getEntitySyncState(userId, data.entityType, data.entityId);

            res.json({
                success: true,
                syncState
            });
        } catch (error) {
            console.error('Error getting entity sync state:', error);
            
            let message = 'Failed to get entity sync state';
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