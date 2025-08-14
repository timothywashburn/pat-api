import { ApiEndpoint } from '../../types';
import NotificationTemplateManager from '../../../controllers/notification-template-manager';
import { SyncNotificationTemplateRequest, SyncNotificationTemplateResponse, Serializer } from "@timothyw/pat-common";

export const syncNotificationTemplateEndpoint: ApiEndpoint<SyncNotificationTemplateRequest, SyncNotificationTemplateResponse> = {
    path: '/api/notifications/templates/:templateId/sync',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const { templateId } = req.params;
            const { sync } = req.body;
            const userId = req.auth!.userId!;

            // Handle virtual inherited template ID
            if (templateId.startsWith('inherited_')) {
                // This is a virtual inherited template - we need to create a real one
                const parts = templateId.split('_');
                const parentTemplateId = parts[1];
                const entityId = parts[2];
                
                if (!sync) {
                    // Break sync - create a real template from the parent
                    const template = await NotificationTemplateManager.getInstance().breakInheritanceForVirtualTemplate(
                        userId,
                        parentTemplateId,
                        entityId
                    );
                    
                    if (!template) {
                        res.status(404).json({
                            success: false,
                            error: 'Parent template not found'
                        });
                        return;
                    }
                    
                    res.json({
                        success: true,
                        template: Serializer.serializeNotificationTemplateData(template)
                    });
                } else {
                    // Already synced, nothing to do
                    res.status(400).json({
                        success: false,
                        error: 'Template is already synced'
                    });
                }
            } else {
                // Regular template sync/unsync
                const template = await NotificationTemplateManager.getInstance().syncWithParent(
                    templateId,
                    userId,
                    sync
                );

                if (!template) {
                    res.status(404).json({
                        success: false,
                        error: 'Template not found'
                    });
                    return;
                }

                res.json({
                    success: true,
                    template: Serializer.serializeNotificationTemplateData(template)
                });
            }
        } catch (error) {
            console.error('Error syncing notification template:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to sync notification template'
            });
        }
    }
};