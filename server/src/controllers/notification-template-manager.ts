import {
    CreateNotificationTemplateRequest,
    ItemId,
    NotificationEntityType,
    NotificationTemplateData,
    NotificationTemplateId,
    NotificationTemplateLevel,
    NotificationTemplateSyncState,
    UserId,
} from "@timothyw/pat-common";
import { NotificationDesyncModel, NotificationTemplateModel } from "../models/mongo/notification-template-data";
import ItemManager from "./item-manager";
import { ItemModel } from "../models/mongo/item-data";
import { ThoughtModel } from "../models/mongo/thought-data";
import NotificationManager from "./notification-manager";
import { HabitModel } from "../models/mongo/habit-data";
import { assertNever } from "../utils/misc";

class NotificationTemplateManager {
    static async getTemplateById(templateId: NotificationTemplateId): Promise<NotificationTemplateData | null> {
        return NotificationTemplateModel.findById(templateId).lean();
    }

    static async getEffectiveTemplates(
        userId: UserId,
        targetLevel: NotificationTemplateLevel,
        targetEntityType: NotificationEntityType,
        targetId: string
    ): Promise<NotificationTemplateData[]> {
        if (targetLevel == NotificationTemplateLevel.PARENT) {
            return await this.getTemplates(userId, targetEntityType, targetId);
        } else if (targetLevel == NotificationTemplateLevel.ENTITY) {
            const syncState = await this.getEntitySyncState(userId, targetEntityType, targetId);

            if (syncState == NotificationTemplateSyncState.SYNCED) {
                const parentId = await this.getParentID(targetEntityType, targetId);
                return await this.getTemplates(userId, targetEntityType, parentId!);
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
            // active: true // I don't think we should have this here otherwise the client doesn't receive inactive templates
        }).sort({ createdAt: -1 });

        return templates.map(template => template.toObject());
    }

    static async getEntitiesForParent(userId: UserId, entityType: NotificationEntityType, parentId: string): Promise<any[]> {
        try {
            switch (entityType) {
                case NotificationEntityType.AGENDA_ITEM:
                    const items = await ItemManager.getInstance().getAllByUser(userId);
                    return items.filter(item => item.category === parentId);
                case NotificationEntityType.HABIT:
                    const habits = await HabitModel.find({ userId });
                    return habits.map(habit => habit.toObject());
                case NotificationEntityType.AGENDA_PANEL:
                case NotificationEntityType.INBOX_PANEL:
                case NotificationEntityType.HABIT_PANEL:
                    throw new Error(`Type ${entityType} does not have a parent`);
                default:
                    return assertNever(entityType);
            }
        } catch (error) {
            console.error('Error fetching entities for template:', error);
            return [];
        }
    }

    static async getEntityData(userId: UserId, entityType: NotificationEntityType, targetId: string): Promise<any> {
        try {
            switch (entityType) {
                case NotificationEntityType.AGENDA_ITEM:
                    const item = await ItemModel.findById(targetId);
                    return item ? item.toObject() : null;

                case NotificationEntityType.HABIT:
                    const habit = await HabitModel.findById(targetId);
                    return habit ? habit.toObject() : null;

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

                case NotificationEntityType.HABIT_PANEL:
                    const habitCount = await HabitModel.countDocuments({
                        userId,
                    });
                    return {
                        habitCount
                    };

                default:
                    return assertNever(entityType);
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

    static async getParentID(entityType: NotificationEntityType, targetId?: string): Promise<string | null> {
        let subId: string | null = null;

        switch (entityType) {
            case NotificationEntityType.AGENDA_ITEM:
                const item = await ItemManager.getInstance().getById(targetId as ItemId);
                if (!item!.category) return null;
                subId = item!.category;
                break;
            case NotificationEntityType.HABIT:
                break;
            case NotificationEntityType.AGENDA_PANEL:
            case NotificationEntityType.INBOX_PANEL:
            case NotificationEntityType.HABIT_PANEL:
                return null;
        }

        if (!subId) return entityType;
        return `${entityType}_${subId}`;
    }

    static hasParent(entityType: NotificationEntityType): boolean {
        switch (entityType) {
            case NotificationEntityType.AGENDA_ITEM:
                return true;
            case NotificationEntityType.HABIT:
            case NotificationEntityType.AGENDA_PANEL:
            case NotificationEntityType.INBOX_PANEL:
            case NotificationEntityType.HABIT_PANEL:
                return false;
        }
    }

    static async getEntitySyncState(userId: UserId, entityType: NotificationEntityType, targetId: string): Promise<NotificationTemplateSyncState> {
        if (!this.hasParent(entityType)) return NotificationTemplateSyncState.NO_PARENT;

        const exists = await NotificationDesyncModel.exists({
            userId,
            targetId,
        });

        return exists ? NotificationTemplateSyncState.DESYNCED : NotificationTemplateSyncState.SYNCED;
    }

    // note: since this is at the entity level, these templates are NotificationTemplateLevel.ENTITY
    static async enableEntitySync(userId: UserId, targetEntityType: NotificationEntityType, targetId: string): Promise<void> {
        await Promise.all([
            NotificationTemplateModel.deleteMany({
                userId,
                targetEntityType,
                targetId
            }),
            NotificationDesyncModel.deleteOne({
                targetId,
            })
        ]);
    }

    // note: since this is at the entity level, these templates are NotificationTemplateLevel.ENTITY
    static async breakEntitySync(userId: UserId, targetEntityType: NotificationEntityType, targetId: string): Promise<void> {
        // even though this is a call to effective, it should only return parent templates (because sync is on)
        const parentTemplates = await NotificationTemplateManager.getEffectiveTemplates(
            userId, NotificationTemplateLevel.ENTITY, targetEntityType, targetId);

        await NotificationDesyncModel.create({
            userId,
            targetId,
        });

        await Promise.all(
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
        if (!template.active) return;

        const variant = NotificationManager.getVariant(template.variantData.type);

        if (template.targetLevel == NotificationTemplateLevel.PARENT) {
            console.log(`🌐 Template is a parent template (${template.targetId})`);

            const entities = await NotificationTemplateManager.getEntitiesForParent(template.userId, template.targetEntityType, template.targetId);
            console.log(`📊 Found ${entities.length} entities for parent template ${template.userId}`);

            for (const entity of entities) {
                try {
                    console.log(`📅 Scheduling parent template for ${template.targetEntityType} ${entity._id}`);
                    await variant.attemptSchedule(template.userId, template, entity, {
                        template: template,
                        entity: entity,
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
                await variant.attemptSchedule(template.userId, template, entityData, {
                    templateId: template._id,
                });
            } else {
                console.warn(`⚠️  Entity ${template.targetId} not found for template ${template._id}`);
            }
        }
    }

    static async onNewEntity(userId: UserId, targetEntityType: NotificationEntityType, targetId: string, entity: any): Promise<void> {
        const templates = await NotificationTemplateManager.getTemplates(userId, targetEntityType, targetId);

        for (const template of templates) {
            if (!template.active) continue;
            const variant = NotificationManager.getVariant(template.variantData.type);
            await variant.attemptSchedule(template.userId, template, entity, {});
        }
    }
}

export default NotificationTemplateManager;