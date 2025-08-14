import { ApiEndpoint } from '../../types';
import NotificationTemplateManager from '../../../controllers/notification-template-manager';

interface GetEntitySyncResponse {
    success: boolean;
    synced: boolean;
    hasParentTemplates: boolean;
    error?: string;
}

export const getEntitySyncEndpoint: ApiEndpoint<undefined, GetEntitySyncResponse> = {
    path: '/api/notifications/entity-sync',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const { entityType, entityId } = req.query;
            const userId = req.auth!.userId!;
            const manager = NotificationTemplateManager.getInstance();

            if (!entityType || !entityId) {
                res.status(400).json({
                    success: false,
                    error: 'Missing entityType or entityId'
                });
                return;
            }

            const synced = await manager.getEntitySyncState(userId, entityType as any, entityId as string);
            const parentTemplates = await manager.getParentTemplates(userId, entityType as any);
            
            res.json({
                success: true,
                synced,
                hasParentTemplates: parentTemplates.length > 0
            });
        } catch (error) {
            console.error('Error getting entity sync state:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get entity sync state'
            });
        }
    }
};