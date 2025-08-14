import { ApiEndpoint } from '../../types';
import NotificationTemplateManager from '../../../controllers/notification-template-manager';
import { GetNotificationTemplatesResponse, Serializer } from "@timothyw/pat-common";

export const getNotificationTemplatesEndpoint: ApiEndpoint<undefined, GetNotificationTemplatesResponse> = {
    path: '/api/notifications/templates',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const { entityType, entityId } = req.query;
            
            const templates = await NotificationTemplateManager.getInstance().getAllByUser(
                req.auth!.userId!,
                entityType as any,
                entityId as string
            );

            res.json({
                success: true,
                templates: templates.map(template => Serializer.serializeNotificationTemplateData(template))
            });
        } catch (error) {
            console.error('Error fetching notification templates:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch notification templates'
            });
        }
    }
};