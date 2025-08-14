import { ApiEndpoint } from '../../types';
import NotificationTemplateManager from '../../../controllers/notification-template-manager';
import { CreateNotificationTemplateRequest, CreateNotificationTemplateResponse, Serializer } from "@timothyw/pat-common";
import NotificationManager from "../../../controllers/notification-manager";
import { NotificationType } from "../../../models/notification-handler";
import { GenericNotificationHandler } from "../../../notifications/generic-notification-handler";
import { ItemModel } from "../../../models/mongo/item-data";

export const createNotificationTemplateEndpoint: ApiEndpoint<CreateNotificationTemplateRequest, CreateNotificationTemplateResponse> = {
    path: '/api/notifications/templates',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const templateData = req.body;

            const template = await NotificationTemplateManager.getInstance().create(
                req.auth!.userId!,
                templateData
            );

            // Schedule notifications for existing entities that match this template
            const userId = req.auth!.userId!;
            if (template.entityType === 'agenda_item' && template.entityId) {
                // Template is for a specific entity - only schedule for that entity
                const specificItem = await ItemModel.findById(template.entityId);
                if (specificItem) {
                    const genericHandler = NotificationManager.getHandler(NotificationType.GENERIC_TEMPLATE) as GenericNotificationHandler;
                    console.log(`📋 Scheduling specific template "${template.name}" for agenda item ${template.entityId}`);
                    await genericHandler.scheduleFromTemplate(template, template.entityId, specificItem.toObject());
                }
            } else if (template.entityType === 'agenda_item' && !template.entityId) {
                // Template is global - schedule for all existing items
                const existingItems = await ItemModel.find({ userId });
                const genericHandler = NotificationManager.getHandler(NotificationType.GENERIC_TEMPLATE) as GenericNotificationHandler;
                
                for (const item of existingItems) {
                    console.log(`📋 Scheduling global template "${template.name}" for existing agenda item ${item._id}`);
                    await genericHandler.scheduleFromTemplate(template, item._id.toString(), item.toObject());
                }
            }

            res.json({
                success: true,
                template: Serializer.serializeNotificationTemplateData(template)
            });
        } catch (error) {
            console.error('Error creating notification template:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create notification template'
            });
        }
    }
};