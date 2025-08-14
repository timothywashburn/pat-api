import { ApiEndpoint } from '../../types';
import NotificationTemplateManager from '../../../controllers/notification-template-manager';
import { UpdateNotificationTemplateRequest, UpdateNotificationTemplateResponse, Serializer } from "@timothyw/pat-common";

export const updateNotificationTemplateEndpoint: ApiEndpoint<UpdateNotificationTemplateRequest, UpdateNotificationTemplateResponse> = {
    path: '/api/notifications/templates/:templateId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const { templateId } = req.params;
            const updates = req.body;

            const template = await NotificationTemplateManager.getInstance().update(
                templateId,
                req.auth!.userId!,
                updates
            );

            if (!template) {
                res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
                return;
            }

            // Update child templates if this is a parent template
            if (!template.entityId) {
                await NotificationTemplateManager.getInstance().updateChildTemplates(templateId);
            }

            res.json({
                success: true,
                template: Serializer.serializeNotificationTemplateData(template)
            });
        } catch (error) {
            console.error('Error updating notification template:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update notification template'
            });
        }
    }
};