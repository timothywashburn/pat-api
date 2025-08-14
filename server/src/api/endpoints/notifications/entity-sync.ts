import { ApiEndpoint } from '../../types';
import NotificationTemplateManager from '../../../controllers/notification-template-manager';
import { Serializer } from "@timothyw/pat-common";

interface EntitySyncRequest {
    entityType: string;
    entityId: string;
    synced: boolean;
}

interface EntitySyncResponse {
    success: boolean;
    synced: boolean;
    templates?: any[];
    error?: string;
}

export const entitySyncEndpoint: ApiEndpoint<EntitySyncRequest, EntitySyncResponse> = {
    path: '/api/notifications/entity-sync',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const { entityType, entityId, synced } = req.body;
            const userId = req.auth!.userId!;
            const manager = NotificationTemplateManager.getInstance();

            if (synced) {
                // Enable sync - delete individual templates and inherit from parent
                await manager.enableEntitySync(userId, entityType as any, entityId);
                const templates = await manager.getEffectiveTemplatesForEntity(userId, entityType as any, entityId);
                
                res.json({
                    success: true,
                    synced: true,
                    templates: templates.map(template => Serializer.serializeNotificationTemplateData(template))
                });
            } else {
                // Break sync - copy parent templates as individual templates
                const copiedTemplates = await manager.breakEntitySync(userId, entityType as any, entityId);
                
                res.json({
                    success: true,
                    synced: false,
                    templates: copiedTemplates.map(template => Serializer.serializeNotificationTemplateData(template))
                });
            }
        } catch (error) {
            console.error('Error updating entity sync:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update entity sync'
            });
        }
    }
};