import { ApiEndpoint } from '../../types';
import { PreviewNotificationTemplateRequest, PreviewNotificationTemplateResponse, NotificationContext } from "@timothyw/pat-common";
import { TemplateEngine } from '../../../utils/template-engine';
import { ItemModel } from '../../../models/mongo/item-data';

export enum NotificationParentType {
    AGENDA_PANEL = 'agenda_panel',
}

export enum NotificationEntityType {
    INBOX_PANEL = 'inbox_panel',
    AGENDA_ITEM = 'agenda_item',
}

export const previewNotificationTemplateEndpoint: ApiEndpoint<PreviewNotificationTemplateRequest, PreviewNotificationTemplateResponse> = {
    path: '/api/notifications/templates/preview',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const { templateTitle, templateBody, entityType, entityId, variables = {} } = req.body;

            // Get entity data for preview
            const entityData = await getEntityDataForPreview(entityType as NotificationEntityType, entityId);
            if (!entityData) {
                res.status(404).json({
                    success: false,
                    error: 'Entity not found for preview'
                });
                return;
            }

            // Create notification context
            const context: NotificationContext = {
                entityId,
                entityType: entityType as any,
                entityData,
                userId: req.auth!.userId!,
                variables: {
                    ...TemplateEngine.createBaseContext(entityData),
                    ...TemplateEngine.calculateTimeVariables(entityData),
                    ...variables
                }
            };

            // Validate templates
            const titleValidation = TemplateEngine.validateTemplate(templateTitle, context);
            const bodyValidation = TemplateEngine.validateTemplate(templateBody, context);

            const allMissingVars = [...titleValidation.missingVariables, ...bodyValidation.missingVariables];

            if (!titleValidation.valid || !bodyValidation.valid) {
                res.json({
                    success: true,
                    preview: {
                        title: templateTitle, // Return original if invalid
                        body: templateBody,
                        variables: context.variables
                    },
                    missingVariables: allMissingVars
                });
                return;
            }

            // Render templates
            const renderedTitle = TemplateEngine.replaceVariables(templateTitle, context);
            const renderedBody = TemplateEngine.replaceVariables(templateBody, context);

            res.json({
                success: true,
                preview: {
                    title: renderedTitle,
                    body: renderedBody,
                    variables: context.variables
                },
                missingVariables: []
            });
        } catch (error) {
            console.error('Error previewing notification template:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to preview notification template'
            });
        }
    }
};

async function getEntityDataForPreview(entityType: NotificationEntityType, entityId: string): Promise<any> {
    try {
        switch (entityType) {
            case NotificationEntityType.AGENDA_ITEM:
                const item = await ItemModel.findById(entityId);
                return item ? item.toObject() : null;

            case NotificationEntityType.INBOX_PANEL:
                return { entityType, name: 'Inbox Panel', thoughtCount: 3 };
            
            default:
                return null;
        }
    } catch (error) {
        console.error('Error fetching entity data for preview:', error);
        return null;
    }
}