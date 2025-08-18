import { ApiEndpoint } from '../../types';
import NotificationTemplateManager from '../../../controllers/notification-template-manager';
import {
    GetNotificationTemplatesResponse,
    NotificationEntityType,
    NotificationTemplateLevel,
    Serializer
} from "@timothyw/pat-common";

export const getNotificationTemplatesEndpoint: ApiEndpoint<undefined, GetNotificationTemplatesResponse> = {
    path: '/api/notifications/templates',
    method: 'get',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const { targetLevel, targetEntityType, targetId } = req.query as {
                targetLevel: NotificationTemplateLevel;
                targetEntityType: NotificationEntityType;
                targetId: string;
            };
            
            const templates = await NotificationTemplateManager.getEffectiveTemplates(
                req.auth!.userId!,
                targetLevel,
                targetEntityType,
                targetId
            );

            res.json({
                success: true,
                templates: templates.map(template => Serializer.serialize(template))
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