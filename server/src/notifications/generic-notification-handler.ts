import {
    NotificationContent,
    NotificationContext,
    NotificationData,
    NotificationHandler,
    NotificationType,
    ScheduleDataResult
} from "../models/notification-handler";
import {
    NotificationContext as CommonNotificationContext,
    NotificationTemplateData,
    UserId,
    NotificationEntityType
} from "@timothyw/pat-common";
import { NotificationTemplateModel } from "../models/mongo/notification-template-data";
import { TemplateEngine } from "../utils/template-engine";
import { ItemModel } from '../models/mongo/item-data';
import { ListItemModel } from '../models/mongo/list-item-data';
import { HabitModel } from '../models/mongo/habit-data';

interface GenericNotificationContext extends NotificationContext {
    templateId: string;
    entityId: string;
    entityData: any;
    scheduledFor: Date;
}

interface GenericNotificationData extends NotificationData {
    templateId: string;
    entityId: string;
}

export class GenericNotificationHandler extends NotificationHandler<GenericNotificationContext, GenericNotificationData> {
    type = NotificationType.GENERIC_TEMPLATE; // We'll need to add this to the enum
    
    protected async getScheduleData(userId: UserId, context: GenericNotificationContext): ScheduleDataResult<GenericNotificationData> {
        console.log(`Scheduling generic notification for user ${userId} with template ${context.templateId}`);
        try {
            // Get the template from the database
            const template = await NotificationTemplateModel.findById(context.templateId);
            if (!template || !template.active) {
                return undefined;
            }
            
            return [{
                userId,
                scheduledTime: context.scheduledFor.getTime().toString(),
                templateId: context.templateId,
                entityId: context.entityId
            }];
        } catch (error) {
            console.error('Error scheduling generic notification:', error);
            return undefined;
        }
    }
    
    async getContent(userId: UserId, data: GenericNotificationData): Promise<NotificationContent | null> {
        try {
            // Get the template
            const template = await NotificationTemplateModel.findById(data.templateId);
            if (!template || !template.active) {
                console.error('Template not found or inactive:', data.templateId);
                return null;
            }
            
            // Get fresh entity data for template variables
            const entityData = await this.getEntityData(template.entityType, data.entityId);
            if (!entityData) {
                console.error('Entity data not found:', template.entityType, data.entityId);
                return null;
            }
            
            // Create notification context for template rendering
            const notificationContext: CommonNotificationContext = {
                entityId: data.entityId,
                entityType: template.entityType,
                entityData,
                userId,
                variables: {
                    ...TemplateEngine.createBaseContext(entityData),
                    ...TemplateEngine.calculateTimeVariables(entityData),
                    ...template.content.variables
                }
            };
            
            // Validate template has all required variables
            const titleValidation = TemplateEngine.validateTemplate(template.content.title, notificationContext);
            const bodyValidation = TemplateEngine.validateTemplate(template.content.body, notificationContext);
            
            if (!titleValidation.valid || !bodyValidation.valid) {
                const missingVars = [...titleValidation.missingVariables, ...bodyValidation.missingVariables];
                console.error('Missing template variables:', missingVars);
                return null;
            }
            
            // Render the template
            const renderedTitle = TemplateEngine.replaceVariables(template.content.title, notificationContext);
            const renderedBody = TemplateEngine.replaceVariables(template.content.body, notificationContext);
            
            return {
                title: renderedTitle,
                body: renderedBody
            };
            
        } catch (error) {
            console.error('Error generating notification content:', error);
            return null;
        }
    }
    
    async onApiStart(): Promise<void> {
        console.log('🔄 GenericNotificationHandler: Scheduling notifications for existing templates and entities');
        try {
            // Get all active notification templates
            const templates = await NotificationTemplateModel.find({ active: true });
            console.log(`📋 Found ${templates.length} active notification templates`);
            
            for (const template of templates) {
                console.log(`🎨 Processing template "${template.name}" for ${template.entityType}`);
                
                if (template.entityId) {
                    // Template is for a specific entity
                    console.log(`📌 Template is specific to entity ${template.entityId}`);
                    const entityData = await this.getEntityData(template.entityType, template.entityId);
                    if (entityData) {
                        console.log(`📅 Scheduling specific template "${template.name}" for ${template.entityType} ${template.entityId}`);
                        await this.scheduleFromTemplate(template.toObject(), template.entityId, entityData);
                    } else {
                        console.warn(`⚠️  Entity ${template.entityId} not found for template ${template._id}`);
                    }
                } else {
                    // Template applies to entities based on the entity type
                    if (template.entityType.endsWith('_defaults')) {
                        // This is a parent template - schedule for all child entities
                        console.log(`🌐 Template is a parent template (${template.entityType})`);
                        const entities = await this.getEntitiesForTemplate(template);
                        console.log(`📊 Found ${entities.length} entities for parent template ${template.userId}`);
                        
                        for (const entity of entities) {
                            try {
                                console.log(`📅 Scheduling parent template "${template.name}" for entity ${entity._id}`);
                                await this.scheduleFromTemplate(template.toObject(), entity._id.toString(), entity.toObject());
                            } catch (error) {
                                console.error(`❌ Failed to schedule template ${template._id} for entity ${entity._id}:`, error);
                            }
                        }
                    } else {
                        // Individual entity template - schedule for the entity itself
                        console.log(`📋 Template is individual entity template for ${template.entityType}`);
                        const entityData = { entityType: template.entityType, id: 'entity' };
                        await this.scheduleFromTemplate(template.toObject(), 'entity', entityData);
                    }
                }
            }
            console.log('✅ GenericNotificationHandler: Finished scheduling existing notifications');
        } catch (error) {
            console.error('❌ Error in GenericNotificationHandler onApiStart:', error);
        }
    }

    async onPostSend(data: GenericNotificationData): Promise<void> {
        try {
            // Check if this template has follow-up notifications or recurring patterns
            const template = await NotificationTemplateModel.findById(data.templateId);
            if (template && template.trigger.type === 'recurring') {
                // Handle recurring notifications
                await this.scheduleRecurringNotification(template, data.entityId);
            }
        } catch (error) {
            console.error('Error in post-send processing:', error);
        }
    }
    
    private async getEntitiesForTemplate(template: NotificationTemplateData): Promise<any[]> {
        try {
            switch (template.entityType) {
                case 'agenda_item':
                    return await ItemModel.find({ userId: template.userId });
                
                case 'habit':
                    return await HabitModel.find({ userId: template.userId });
                
                // Panel-level templates apply to their corresponding individual entities
                case 'agenda':
                    return await ItemModel.find({ userId: template.userId });
                case 'habits':
                    return await HabitModel.find({ userId: template.userId });
                
                // Inbox is a single entity, not a collection
                case 'inbox':
                    return [{ _id: 'inbox', userId: template.userId }];
                
                // Parent template types apply to their child entities
                case 'agenda_defaults':
                    return await ItemModel.find({ userId: template.userId });
                case 'habits_defaults':
                    return await HabitModel.find({ userId: template.userId });
                
                default:
                    console.warn('Unknown entity type for template:', template.entityType);
                    return [];
            }
        } catch (error) {
            console.error('Error fetching entities for template:', error);
            return [];
        }
    }
    
    private async getEntityData(entityType: NotificationEntityType, entityId: string): Promise<any> {
        try {
            switch (entityType) {
                case 'agenda_item':
                    const item = await ItemModel.findById(entityId);
                    return item ? item.toObject() : null;

                case 'inbox':
                    return { entityType, id: entityId };
                
                default:
                    console.warn('Unknown entity type:', entityType);
                    return null;
            }
        } catch (error) {
            console.error('Error fetching entity data:', error);
            return null;
        }
    }
    
    private async scheduleRecurringNotification(template: NotificationTemplateData, entityId: string): Promise<void> {
        try {
            // Get the entity data again for the next occurrence
            const entityData = await this.getEntityData(template.entityType, entityId);
            if (!entityData) {
                console.warn('Entity data not found for recurring notification:', entityId);
                return;
            }
            
            if (template.trigger.timing?.testInterval) {
                console.log('🔄 TEST RECURRING: Scheduling next occurrence for template:', template._id);
                // Schedule another occurrence 5 seconds from now
                await this.scheduleFromTemplate(template, entityId, entityData);
            } else {
                console.log('Scheduling recurring notification for template:', template._id);
                // Handle normal recurring logic here
            }
        } catch (error) {
            console.error('Error scheduling recurring notification:', error);
        }
    }
    
    /**
     * Schedule a notification based on a template and entity
     */
    async scheduleFromTemplate(template: NotificationTemplateData, entityId: string, entityData: any): Promise<void> {
        const scheduledFor = this.calculateScheduledTime(template, entityData);
        if (!scheduledFor) {
            console.warn('Could not calculate scheduled time for template:', template._id);
            return;
        }
        
        const context: GenericNotificationContext = {
            templateId: template._id,
            entityId,
            entityData,
            scheduledFor
        };
        
        await this.schedule(template.userId, context);
    }
    
    private calculateScheduledTime(template: NotificationTemplateData, entityData: any): Date | null {
        const now = new Date();
        
        if (template.trigger.type === 'time_based') {
            // Handle TEST TRIGGER: 5-second delay for testing
            if (template.trigger.timing?.testDelay) {
                console.log('🧪 TEST TRIGGER: Scheduling notification for 5 seconds from now');
                return new Date(now.getTime() + 5 * 1000); // 5 seconds from now
            }
            
            // Handle relative timing like "5 minutes before due"
            if (entityData.dueDate && template.trigger.timing?.relativeTo === 'dueDate') {
                const dueDate = new Date(entityData.dueDate);
                const offset = template.trigger.timing?.offset || 0; // in minutes
                return new Date(dueDate.getTime() - (offset * 60 * 1000));
            }
            
            // Handle absolute timing
            if (template.trigger.timing?.absoluteTime) {
                const scheduledTime = new Date(template.trigger.timing.absoluteTime);
                return scheduledTime > now ? scheduledTime : null;
            }
        }
        
        if (template.trigger.type === 'recurring') {
            // Handle TEST TRIGGER for recurring: 5-second intervals
            if (template.trigger.timing?.testInterval) {
                console.log('🧪 TEST RECURRING: Scheduling next notification for 5 seconds from now');
                return new Date(now.getTime() + 5 * 1000); // 5 seconds from now
            }
            
            // Handle normal recurring patterns
            const interval = template.trigger.timing?.interval || 'daily';
            switch (interval) {
                case 'daily':
                    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
                case 'hourly':
                    return new Date(now.getTime() + 60 * 60 * 1000);
                default:
                    return null;
            }
        }
        
        // Default to immediate execution for event-based
        return now;
    }
}