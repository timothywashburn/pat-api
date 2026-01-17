import { ApiEndpoint } from '../../types';
import NotificationTemplateManager from '../../../controllers/notification-template-manager';
import {
    CreateNotificationTemplateRequest,
    createNotificationTemplateRequestSchema,
    CreateNotificationTemplateResponse,
    Serializer
} from "@timothyw/pat-common";
import { z } from 'zod';

export const createNotificationTemplateEndpoint: ApiEndpoint<CreateNotificationTemplateRequest, CreateNotificationTemplateResponse> = {
    path: '/api/notifications/templates',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const userId = req.patAuth!.userId!;
            const data = createNotificationTemplateRequestSchema.parse(req.body);

            const template = await NotificationTemplateManager.create(
                userId,
                data
            );

            // if (template.targetEntityType === NotificationEntityType.AGENDA_ITEM) {
            //     if (template.targetId) {
            //         // Template is for a specific entity - only schedule for that entity
            //         const specificItem = await ItemModel.findById(template.entityId);
            //         if (specificItem) {
            //             const genericHandler = NotificationManager.getHandler(NotificationType.GENERIC_TEMPLATE) as GenericNotificationHandler;
            //             console.log(`📋 Scheduling specific template for agenda item ${template.entityId}`);
            //             await genericHandler.loadTemplate(template, template.entityId, specificItem.toObject());
            //         }
            //     } else {
            //         // Template is global - schedule for all existing items
            //         const existingItems = await ItemModel.find({ userId });
            //         const genericHandler = NotificationManager.getHandler(NotificationType.GENERIC_TEMPLATE) as GenericNotificationHandler;
            //
            //         for (const item of existingItems) {
            //             console.log(`📋 Scheduling global template for existing agenda item ${item._id}`);
            //             await genericHandler.loadTemplate(template, item._id.toString(), item.toObject());
            //         }
            //     }
            // }

            res.json({
                success: true,
                template: Serializer.serialize(template)
            });
        } catch (error) {
            console.error('Error creating notification template:', error);

            let message = 'Failed to create notification template';
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