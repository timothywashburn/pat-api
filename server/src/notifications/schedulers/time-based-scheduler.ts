import {
    NotificationContent,
    NotificationContext,
    NotificationData,
    NotificationScheduler,
    ScheduleDataResult
} from "../../models/notification-scheduler";
import {
    NotificationTemplateData,
    NotificationTriggerType,
    UserId
} from "@timothyw/pat-common";
import { NotificationTemplateModel } from "../../models/mongo/notification-template-data";
import NotificationTemplateManager from "../../controllers/notification-template-manager";

interface TimeBasedNotificationContext extends NotificationContext {
}

interface GenericNotificationData extends NotificationData {
    templateId: string;
}

export class TimeBasedScheduler extends NotificationScheduler<TimeBasedNotificationContext, GenericNotificationData> {
    type = NotificationTriggerType.TIME_BASED;
    
    protected async getScheduleData(userId: UserId, context: TimeBasedNotificationContext): ScheduleDataResult<GenericNotificationData> {
        console.log(`Scheduling generic notification for user ${userId} with template ${context.templateId}`);
        try {
            const template = await NotificationTemplateModel.findById(context.templateId);
            if (!template || !template.active) return undefined;
            const entityData = await NotificationTemplateManager.getEntityData(template.userId, template.targetEntityType, template.targetId);
            if (!entityData) {
                console.error('Entity data not found for template:', context.templateId);
                return undefined;
            }
            
            return [{
                userId,
                scheduledTime: this.calculateScheduledTime(template.toObject(), entityData).getTime().toString(),
                templateId: context.templateId,
            }];
        } catch (error) {
            console.error('Error scheduling generic notification:', error);
            return undefined;
        }
    }
    
    async getContent(userId: UserId, data: GenericNotificationData): Promise<NotificationContent | null> {
        try {
            const template = await NotificationTemplateModel.findById(data.templateId);
            if (!template || !template.active) {
                console.error('Template not found or inactive:', data.templateId);
                return null;
            }

            // const entityData = await this.getEntityData(template.entityType, data.entityId);
            // if (!entityData) {
            //     console.error('Entity data not found:', template.entityType, data.entityId);
            //     return null;
            // }

            return {
                title: "TEMPORARY FIXED TITLE",
                body: `${template.targetLevel}:${template.targetEntityType}:${template.targetId}`,
            };
            
        } catch (error) {
            console.error('Error generating notification content:', error);
            return null;
        }
    }

    // async onPostSend(data: GenericNotificationData): Promise<void> {
    //     try {
    //         const template = await NotificationTemplateModel.findById(data.templateId);
    //         if (!template) return;
    //
    //         if (template.trigger.type === NotificationTriggerType.RECURRING) {
    //             const entityData = await NotificationTemplateManager.getEntityData(template.userId, template.targetEntityType, template.targetId);
    //             if (!entityData) {
    //                 console.warn('Entity data not found for recurring notification:', template.targetId);
    //                 return;
    //             }
    //             // await this.processEntity(template, template.targetId, entityData);
    //             await this.schedule(template.userId, {
    //                 templateId: template._id,
    //             });
    //         }
    //     } catch (error) {
    //         console.error('Error in post-send processing:', error);
    //     }
    // }
    
    private calculateScheduledTime(template: NotificationTemplateData, entityData: any): Date {
        return new Date(new Date().getTime() + 5 * 1000);
    }
}