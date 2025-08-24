import {
    CreateNotificationTemplateRequest,
    ItemId,
    NotificationEntityType,
    NotificationTemplateData,
    NotificationTemplateId,
    NotificationTemplateLevel,
    UserId,
} from "@timothyw/pat-common";
import { NotificationTemplateModel } from "../models/mongo/notification-template-data";
import ItemManager from "./item-manager";
import { ItemModel } from "../models/mongo/item-data";
import { ThoughtModel } from "../models/mongo/thought-data";
import { TimeBasedScheduler } from "../notifications/schedulers/time-based-scheduler";
import NotificationManager from "./notification-manager";

class NotificationTemplateManager {
    static async getEffectiveTemplates(
        userId: UserId,
        targetLevel: NotificationTemplateLevel,
        targetEntityType: NotificationEntityType,
        targetId: string
    ): Promise<NotificationTemplateData[]> {
        if (targetLevel == NotificationTemplateLevel.PARENT) {
            return await this.getTemplates(userId, targetEntityType, targetId);
        } else if (targetLevel == NotificationTemplateLevel.ENTITY) {
            const isSynced = await this.getEntitySyncState(userId, targetEntityType, targetId);

            if (isSynced) {
                const parentId = await this.getParentID(targetEntityType, targetId);
                return await this.getTemplates(userId, targetEntityType, parentId);
            } else {
                return await this.getTemplates(userId, targetEntityType, targetId);
            }
        } else {
            throw new Error('Unreachable');
        }
    }

    static async getTemplates(userId: UserId, targetEntityType: NotificationEntityType, targetId: string): Promise<NotificationTemplateData[]> {
        const templates = await NotificationTemplateModel.find({
            userId,
            targetEntityType: targetEntityType,
            targetId,
            active: true
        }).sort({ createdAt: -1 });

        return templates.map(template => template.toObject());
    }

    static async getEntitiesForParent(userId: UserId, entityType: NotificationEntityType, parentId: string): Promise<any[]> {
        try {
            switch (entityType) {
                case NotificationEntityType.AGENDA_ITEM:
                    const items = await ItemManager.getInstance().getAllByUser(userId);
                    return items.filter(item => item.category === parentId);
                // case NotificationEntityType.AGENDA_PANEL:
                //     const incompleteItems = await ItemModel.countDocuments({
                //         userId,
                //         category: parentId,
                //         completed: false
                //     });
                //     return [{
                //         incompleteItems
                //     }];
                // case NotificationEntityType.INBOX_PANEL:
                //     const inboxCount = await ThoughtModel.countDocuments({
                //         userId,
                //     });
                //     return [{
                //         inboxCount
                //     }];
                default:
                    throw new Error(`Type ${entityType} does not have a parent`);
            }
        } catch (error) {
            console.error('Error fetching entities for template:', error);
            return [];
        }
    }

    static async getEntityData(userId: UserId, entityType: NotificationEntityType, entityId: string): Promise<any> {
        try {
            switch (entityType) {
                case NotificationEntityType.AGENDA_ITEM:
                    const item = await ItemModel.findById(entityId);
                    return item ? item.toObject() : null;

                case NotificationEntityType.AGENDA_PANEL:
                    const incompleteItems = await ItemModel.countDocuments({
                        userId,
                        completed: false
                    });
                    return {
                        incompleteItems
                    };

                case NotificationEntityType.INBOX_PANEL:
                    const inboxCount = await ThoughtModel.countDocuments({
                        userId,
                    });
                    return {
                        inboxCount
                    };

                default:
                    console.warn('Unknown entity type:', entityType);
                    return null;
            }
        } catch (error) {
            console.error('Error fetching entity data:', error);
            return null;
        }
    }

    static async create(userId: UserId, data: CreateNotificationTemplateRequest): Promise<NotificationTemplateData> {
        const template = await NotificationTemplateModel.create({
            userId,
            ...data,
        });

        const templateObject = template.toObject();
        await this.onNewTemplate(templateObject);
        return templateObject;
    }

    static async update(templateId: NotificationTemplateId, userId: UserId, updates: Partial<NotificationTemplateData>): Promise<NotificationTemplateData | null> {
        const template = await NotificationTemplateModel.findOneAndUpdate(
            { _id: templateId, userId },
            {
                ...updates,
                updatedAt: new Date()
            },
            { new: true }
        );

        return template ? template.toObject() : null;
    }

    static async delete(templateId: string, userId: UserId): Promise<boolean> {
        const result = await NotificationTemplateModel.deleteOne({ _id: templateId, userId });
        return result.deletedCount > 0;
    }

    static async getParentID(entityType: NotificationEntityType, entityId?: string): Promise<string> {
        let subId: string | null;

        switch (entityType) {
            case NotificationEntityType.AGENDA_ITEM:
                const item = await ItemManager.getInstance().getById(entityId as ItemId);
                subId = item!.category ?? null;
                break;
            case NotificationEntityType.AGENDA_PANEL:
            case NotificationEntityType.INBOX_PANEL:
                subId = null;
                break;
        }

        if (!subId) throw new Error();

        return `${entityType}_${subId}`;
    }

    static async getEntitySyncState(userId: UserId, targetEntityType: NotificationEntityType, targetId: string): Promise<boolean> {
        const exists = await NotificationTemplateModel.exists({
            userId,
            targetEntityType,
            targetId,
            active: true
        });

        return !exists;
    }

    // note: since this is at the entity level, these templates are NotificationTemplateLevel.ENTITY
    static async enableEntitySync(userId: UserId, targetEntityType: NotificationEntityType, targetId: string): Promise<void> {
        await NotificationTemplateModel.deleteMany({
            userId,
            targetEntityType,
            targetId
        });
    }

    // note: since this is at the entity level, these templates are NotificationTemplateLevel.ENTITY
    static async breakEntitySync(userId: UserId, targetEntityType: NotificationEntityType, targetId: string): Promise<NotificationTemplateData[]> {
        // even though this is a call to effective, it should only return parent templates (because sync is on)
        const parentTemplates = await NotificationTemplateManager.getEffectiveTemplates(
            userId, NotificationTemplateLevel.ENTITY, targetEntityType, targetId);

        return await Promise.all(
            parentTemplates.map(async template => {
                const { _id, createdAt, updatedAt, ...rest } = template;

                const entityTemplate = {
                    ...rest,
                    targetLevel: NotificationTemplateLevel.ENTITY,
                    targetId: targetId
                };
                
                const newTemplate = await NotificationTemplateModel.create(entityTemplate);
                return newTemplate.toObject();
            })
        );
    }

    static async onNewTemplate(template: NotificationTemplateData): Promise<void> {
        const handler = NotificationManager.getHandler(template.trigger.type);

        if (template.targetLevel == NotificationTemplateLevel.PARENT) {
            console.log(`🌐 Template is a parent template (${template.targetId})`);

            const entities = await NotificationTemplateManager.getEntitiesForParent(template.userId, template.targetEntityType, template.targetId);
            console.log(`📊 Found ${entities.length} entities for parent template ${template.userId}`);

            for (const entity of entities) {
                try {
                    console.log(`📅 Loading parent template for entity ${entity._id}`);
                    await handler.schedule(template.userId, {
                        templateId: template._id,
                    });
                } catch (error) {
                    console.error(`❌ Failed to schedule template ${template._id} for entity ${entity._id}:`, error);
                }
            }
        } else if (template.targetLevel == NotificationTemplateLevel.ENTITY) {
            console.log(`📌 Template is specific to entity (${template.targetEntityType})`);

            const entityData = await NotificationTemplateManager.getEntityData(template.userId, template.targetEntityType, template.targetId);
            if (entityData) {
                console.log(`📅 Scheduling specific template for ${template.targetEntityType} ${template.targetId}`);
                await handler.schedule(template.userId, {
                    templateId: template._id,
                });
            } else {
                console.warn(`⚠️  Entity ${template.targetId} not found for template ${template._id}`);
            }
        }
    }

    static async onNewEntity(userId: UserId, targetEntityType: NotificationEntityType, targetId: string): Promise<void> {
        const templates = await NotificationTemplateManager.getTemplates(userId, targetEntityType, targetId);

        for (const template of templates) {
            const handler = NotificationManager.getHandler(template.trigger.type);
            await handler.schedule(template.userId, {
                templateId: template._id,
            });
        }
    }
}

export default NotificationTemplateManager;