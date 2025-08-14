import { ApiEndpoint } from '../../types';
import { PreviewNotificationTemplateRequest, PreviewNotificationTemplateResponse } from "@timothyw/pat-common";
import { TemplateEngine } from '../../../utils/template-engine';
import { NotificationContext } from "@timothyw/pat-common";
import { ItemModel } from '../../../models/mongo/item-data';
import { TaskModel } from '../../../models/mongo/task-data';
import { TaskListModel } from '../../../models/mongo/task-list-data';
import { HabitModel } from '../../../models/mongo/habit-data';

export const previewNotificationTemplateEndpoint: ApiEndpoint<PreviewNotificationTemplateRequest, PreviewNotificationTemplateResponse> = {
    path: '/api/notifications/templates/preview',
    method: 'post',
    auth: 'verifiedEmail',
    handler: async (req, res) => {
        try {
            const { templateTitle, templateBody, entityType, entityId, variables = {} } = req.body;

            // Get entity data for preview
            const entityData = await getEntityDataForPreview(entityType, entityId);
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

async function getEntityDataForPreview(entityType: string, entityId: string): Promise<any> {
    try {
        switch (entityType) {
            case 'agenda_item':
                const item = await ItemModel.findById(entityId);
                return item ? item.toObject() : null;
            
            case 'task':
                const task = await TaskModel.findById(entityId);
                return task ? task.toObject() : null;
            
            case 'task_list':
                const taskList = await TaskListModel.findById(entityId);
                return taskList ? taskList.toObject() : null;
            
            case 'habit':
                const habit = await HabitModel.findById(entityId);
                return habit ? habit.toObject() : null;
            
            // Panel-level entities - return mock data
            case 'agenda':
                return { entityType, name: 'Agenda Panel', itemCount: 5 };
            case 'tasks':
                return { entityType, name: 'Tasks Panel', taskCount: 12, listCount: 3 };
            case 'habits':
                return { entityType, name: 'Habits Panel', habitCount: 7, completedToday: 4 };
            
            default:
                return null;
        }
    } catch (error) {
        console.error('Error fetching entity data for preview:', error);
        return null;
    }
}