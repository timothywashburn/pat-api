import { ApiEndpoint } from '../../types';
import ItemManager from '../../../controllers/item-manager';
import { z } from 'zod';
import {
    CreateAgendaItemRequest,
    createAgendaItemRequestSchema,
    CreateAgendaItemResponse,
    NotificationEntityType,
    NotificationTriggerType,
    Serializer
} from "@timothyw/pat-common";
import NotificationManager from "../../../controllers/notification-manager";
import { TimeBasedHandler } from "../../../notifications/time-based-handler";
import NotificationTemplateManager from "../../../controllers/notification-template-manager";

export const createItemEndpoint: ApiEndpoint<CreateAgendaItemRequest, CreateAgendaItemResponse> = {
    path: '/api/items',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = createAgendaItemRequestSchema.parse(req.body);
            const userId = req.auth!.userId!;

            const item = await ItemManager.getInstance().create(userId, {
                name: data.name,
                dueDate: data.dueDate,
                notes: data.notes,
                urgent: data.urgent,
                category: data.category,
                type: data.type
            });

            if (!item) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to create item'
                });
                return;
            }

            // // TODO: figure out a better way to handle objectids as itemids
            // await NotificationManager.getHandler(NotificationType.ITEM_DEADLINE).schedule(userId, {
            //     itemId: item._id,
            //     notificationNumber: 1
            // });

            // // Schedule generic template notifications for this new agenda item
            // // Only apply global templates (without specific entityId)
            // const genericHandler = NotificationManager.getHandler(NotificationType.GENERIC_TEMPLATE) as GenericNotificationHandler;
            // const templates = await NotificationTemplateModel.find({
            //     userId,
            //     entityType: 'agenda_item',
            //     active: true,
            //     $or: [
            //         { entityId: { $exists: false } },
            //         { entityId: null }
            //     ]
            // });
            //
            // for (const template of templates) {
            //     console.log(`📋 Found global template "${template.name}" for new agenda item ${item._id}`);
            //     await genericHandler.loadTemplate(template.toObject(), item._id.toString(), item);
            // }

            await NotificationTemplateManager.onNewEntity(userId, NotificationEntityType.AGENDA_ITEM, item._id);

            res.json({
                success: true,
                agendaItem: Serializer.serialize(item)
            });
        } catch (error) {
            let message = 'Failed to create item';

            if (error instanceof z.ZodError) {
                message = error.errors[0].message;
            }

            res.status(400).json({
                success: false,
                error: message
            });
        }
    }
};