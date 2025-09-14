import { ApiEndpoint } from '../../types';
import ItemManager from '../../../controllers/item-manager';
import { z } from 'zod';
import {
    ItemId, NotificationEntityType, Serializer,
    UpdateAgendaItemRequest,
    updateAgendaItemRequestSchema,
    UpdateAgendaItemResponse
} from "@timothyw/pat-common";
import NotificationTemplateManager from "../../../controllers/notification-template-manager";

export const updateItemEndpoint: ApiEndpoint<UpdateAgendaItemRequest, UpdateAgendaItemResponse> = {
    path: '/api/items/:itemId',
    method: 'put',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const data = updateAgendaItemRequestSchema.parse(req.body);
            const userId = req.auth!.userId!;
            const itemId = req.params.itemId as ItemId;

            const item = await ItemManager.getInstance().update(req.auth!, itemId, {
                name: data.name,
                dueDate: data.dueDate,
                notes: data.notes,
                urgent: data.urgent,
                category: data.category,
                type: data.type
            });

            if (!item) {
                res.status(404).json({
                    success: false,
                    error: 'Item not found'
                });
                return;
            }

            await NotificationTemplateManager.removeAllForEntity(userId, NotificationEntityType.AGENDA_ITEM, itemId);
            await NotificationTemplateManager.onNewEntity(userId, NotificationEntityType.AGENDA_ITEM, item._id, item);

            res.json({
                success: true,
                agendaItem: Serializer.serialize(item)
            });
        } catch (error) {
            let message = 'Failed to update item';

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