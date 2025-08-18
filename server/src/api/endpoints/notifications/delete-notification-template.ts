import { ApiEndpoint } from '../../types';
import NotificationTemplateManager from '../../../controllers/notification-template-manager';
import { DeleteNotificationTemplateResponse, NotificationTemplateId } from "@timothyw/pat-common";

export const deleteNotificationTemplateEndpoint: ApiEndpoint<undefined, DeleteNotificationTemplateResponse> = {
    path: '/api/notifications/templates/:templateId',
    method: 'delete',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const { templateId } = req.params as { templateId: NotificationTemplateId };

            const deleted = await NotificationTemplateManager.delete(
                templateId,
                req.auth!.userId!
            );

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
                return;
            }

            res.json({
                success: true
            });
        } catch (error) {
            console.error('Error deleting notification template:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete notification template'
            });
        }
    }
};