import { ApiEndpoint } from '../../types';
import NotificationTemplateManager from '../../../controllers/notification-template-manager';
import {
    UpdateNotificationTemplateRequest,
    UpdateNotificationTemplateResponse,
    Serializer,
    updateNotificationTemplateRequestSchema,
    NotificationTemplateId
} from "@timothyw/pat-common";
import { z } from 'zod';

export const updateNotificationTemplateEndpoint: ApiEndpoint<UpdateNotificationTemplateRequest, UpdateNotificationTemplateResponse> = {
    path: '/api/notifications/templates/:templateId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const { templateId } = req.params as { templateId: NotificationTemplateId };
            const updates = updateNotificationTemplateRequestSchema.parse(req.body);

            const template = await NotificationTemplateManager.update(
                templateId,
                req.patAuth!.userId!,
                updates
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
                template: Serializer.serialize(template)
            });
        } catch (error) {
            console.error('Error updating notification template:', error);
            
            let message = 'Failed to update notification template';
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