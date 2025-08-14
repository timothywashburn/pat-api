import { UserId, NotificationTemplateData, CreateNotificationTemplateData, CreateNotificationTemplateRequest, NotificationEntityType, NotificationTemplateId } from "@timothyw/pat-common";
import { NotificationTemplateModel } from "../models/mongo/notification-template-data";
import { EntitySyncStateModel } from "../models/mongo/entity-sync-state";
import { v4 as uuidv4 } from 'uuid';

class NotificationTemplateManager {
    private static instance: NotificationTemplateManager;

    static getInstance(): NotificationTemplateManager {
        if (!NotificationTemplateManager.instance) {
            NotificationTemplateManager.instance = new NotificationTemplateManager();
        }
        return NotificationTemplateManager.instance;
    }

    /**
     * Get all notification templates for a user
     */
    async getAllByUser(userId: UserId, entityType?: NotificationEntityType, entityId?: string): Promise<NotificationTemplateData[]> {
        // If requesting templates for a specific entity, handle sync logic
        if (entityType && entityId) {
            return this.getEffectiveTemplatesForEntity(userId, entityType, entityId);
        }
        
        const query: any = { userId, active: true };
        
        if (entityType) {
            query.entityType = entityType;
        }
        
        if (entityId !== undefined) {
            query.entityId = entityId;
        }
        
        const templates = await NotificationTemplateModel.find(query).sort({ createdAt: -1 });
        return templates.map(template => template.toObject());
    }

    /**
     * Get a specific notification template by ID
     */
    async getById(templateId: string, userId: UserId): Promise<NotificationTemplateData | null> {
        const template = await NotificationTemplateModel.findOne({ _id: templateId, userId });
        return template ? template.toObject() : null;
    }

    /**
     * Create a new notification template
     */
    async create(userId: UserId, templateRequest: CreateNotificationTemplateRequest): Promise<NotificationTemplateData> {
        const templateData: CreateNotificationTemplateData = {
            ...templateRequest,
            userId,
            inheritedFrom: templateRequest.inheritedFrom as NotificationTemplateId
        };
        
        const template = await NotificationTemplateModel.create({
            _id: uuidv4(),
            ...templateData,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return template.toObject();
    }

    /**
     * Update a notification template
     */
    async update(templateId: string, userId: UserId, updates: Partial<NotificationTemplateData>): Promise<NotificationTemplateData | null> {
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

    /**
     * Delete a notification template
     */
    async delete(templateId: string, userId: UserId): Promise<boolean> {
        // Delete the template
        const result = await NotificationTemplateModel.deleteOne({ _id: templateId, userId });
        return result.deletedCount > 0;
    }

    /**
     * Sync/unsync a template with its parent
     */
    async syncWithParent(templateId: string, userId: UserId, sync: boolean): Promise<NotificationTemplateData | null> {
        if (sync) {
            // Reset to inherit from parent
            const template = await NotificationTemplateModel.findOne({ _id: templateId, userId });
            if (!template || !template.inheritedFrom) {
                throw new Error('Template has no parent to sync with');
            }

            const parentTemplate = await NotificationTemplateModel.findById(template.inheritedFrom);
            if (!parentTemplate) {
                throw new Error('Parent template not found');
            }

            // Copy parent template properties
            const updatedTemplate = await NotificationTemplateModel.findOneAndUpdate(
                { _id: templateId, userId },
                {
                    trigger: parentTemplate.trigger,
                    content: parentTemplate.content,
                    customized: false,
                    updatedAt: new Date()
                },
                { new: true }
            );

            return updatedTemplate ? updatedTemplate.toObject() : null;
        } else {
            // Mark as customized (unsynced)
            const updatedTemplate = await NotificationTemplateModel.findOneAndUpdate(
                { _id: templateId, userId },
                {
                    customized: true,
                    updatedAt: new Date()
                },
                { new: true }
            );

            return updatedTemplate ? updatedTemplate.toObject() : null;
        }
    }

    /**
     * Get parent templates for an entity type (from defaults)
     */
    async getParentTemplates(userId: UserId, entityType: NotificationEntityType): Promise<NotificationTemplateData[]> {
        const parentDefaultsType = this.getParentDefaultsType(entityType);
        if (!parentDefaultsType) return [];

        const templates = await NotificationTemplateModel.find({
            userId,
            entityType: parentDefaultsType,
            entityId: { $exists: false }, // Default templates have no entityId
            active: true
        });
        return templates.map(template => template.toObject());
    }

    /**
     * Create inherited templates for a new entity
     */
    async createInheritedTemplates(userId: UserId, entityType: NotificationEntityType, entityId: string): Promise<NotificationTemplateData[]> {
        const parentTemplates = await this.getParentTemplates(userId, entityType);
        const createdTemplates: NotificationTemplateData[] = [];

        for (const parentTemplate of parentTemplates) {
            const childTemplate = await NotificationTemplateModel.create({
                _id: uuidv4(),
                userId,
                entityType,
                entityId,
                name: parentTemplate.name,
                description: parentTemplate.description,
                trigger: parentTemplate.trigger,
                content: parentTemplate.content,
                active: parentTemplate.active,
                inheritedFrom: parentTemplate._id,
                customized: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            createdTemplates.push(childTemplate.toObject());
        }

        return createdTemplates;
    }


    /**
     * Get the parent defaults type for inheritance
     */
    private getParentDefaultsType(entityType: NotificationEntityType): NotificationEntityType | null {
        switch (entityType) {
            case 'agenda_item':
                return 'agenda_defaults';
            case 'task':
            case 'task_list':
                return 'tasks_defaults';
            case 'habit':
                return 'habits_defaults';
            default:
                return null; // No parent defaults for these entity types
        }
    }

    /**
     * Get templates for a specific entity including inherited ones
     */
    async getEffectiveTemplates(userId: UserId, entityType: NotificationEntityType, entityId: string): Promise<NotificationTemplateData[]> {
        // Get entity-specific templates
        const query = { userId, entityType, entityId, active: true };
        const entityTemplates = await NotificationTemplateModel.find(query).sort({ createdAt: -1 });
        
        // Get parent templates (only non-customized ones that aren't overridden)
        const parentTemplates = await this.getParentTemplates(userId, entityType);
        const entityTemplateNames = new Set(entityTemplates.map((t: any) => t.name));
        
        const effectiveInheritedTemplates = parentTemplates.filter(
            t => !entityTemplateNames.has(t.name)
        );

        return [...entityTemplates.map((t: any) => t.toObject()), ...effectiveInheritedTemplates];
    }

    /**
     * Get effective templates for an entity (handles sync state)
     */
    async getEffectiveTemplatesForEntity(userId: UserId, entityType: NotificationEntityType, entityId: string): Promise<NotificationTemplateData[]> {
        // Check if entity is synced with parent
        const isSynced = await this.getEntitySyncState(userId, entityType, entityId);
        
        if (isSynced) {
            // Return parent templates (read-only)
            return await this.getParentTemplates(userId, entityType);
        } else {
            // Return individual templates for this entity
            const templates = await NotificationTemplateModel.find({
                userId,
                entityType,
                entityId,
                active: true
            }).sort({ createdAt: -1 });
            
            return templates.map(template => template.toObject());
        }
    }

    /**
     * Break inheritance for a virtual template (convert inherited template to real template)
     */
    async breakInheritanceForVirtualTemplate(userId: UserId, parentTemplateId: string, entityId: string): Promise<NotificationTemplateData | null> {
        // Get the parent template
        const parentTemplate = await NotificationTemplateModel.findById(parentTemplateId);
        if (!parentTemplate) {
            throw new Error('Parent template not found');
        }

        // Determine the entity type based on the parent
        const entityType = this.getChildEntityType(parentTemplate.entityType);
        if (!entityType) {
            throw new Error('Cannot determine entity type for inheritance');
        }

        // Create a new real template based on the parent
        const newTemplate = await NotificationTemplateModel.create({
            _id: uuidv4(),
            userId,
            entityType,
            entityId,
            name: parentTemplate.name,
            description: parentTemplate.description,
            trigger: parentTemplate.trigger,
            content: parentTemplate.content,
            active: parentTemplate.active,
            inheritedFrom: parentTemplate._id,
            customized: true, // Mark as customized since user broke sync
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return newTemplate.toObject();
    }

    /**
     * Get the child entity type for inheritance breaking
     */
    private getChildEntityType(parentEntityType: NotificationEntityType): NotificationEntityType | null {
        switch (parentEntityType) {
            case 'agenda':
                return 'agenda_item';
            case 'tasks':
                return 'task';
            case 'habits':
                return 'habit';
            default:
                return null;
        }
    }

    /**
     * Get sync state for an entity
     * No record = synced (default), record exists = not synced
     */
    async getEntitySyncState(userId: UserId, entityType: NotificationEntityType, entityId: string): Promise<boolean> {
        try {
            const syncState = await EntitySyncStateModel.findOne({
                userId,
                entityType,
                entityId
            }).maxTimeMS(5000); // 5 second timeout
            
            // If no record exists, entity is synced (default behavior)
            // If record exists, entity is not synced (syncState.synced should always be false)
            return !syncState;
        } catch (error) {
            console.error('Error in getEntitySyncState:', error);
            return true; // Default to synced on error
        }
    }

    /**
     * Set sync state for an entity
     * Only stores records for non-synced entities (synced = default when no record exists)
     */
    async setEntitySyncState(userId: UserId, entityType: NotificationEntityType, entityId: string, synced: boolean): Promise<void> {
        if (synced) {
            // Remove record - no record means synced (default)
            await EntitySyncStateModel.deleteOne({ userId, entityType, entityId });
        } else {
            // Create/update record - presence of record means not synced
            await EntitySyncStateModel.findOneAndUpdate(
                { userId, entityType, entityId },
                { 
                    synced: false,
                    updatedAt: new Date() 
                },
                { upsert: true }
            );
        }
    }

    /**
     * Break sync for an entity - copy all parent templates as individual templates
     */
    async breakEntitySync(userId: UserId, entityType: NotificationEntityType, entityId: string): Promise<NotificationTemplateData[]> {
        // Get parent templates
        const parentTemplates = await this.getParentTemplates(userId, entityType);
        const copiedTemplates: NotificationTemplateData[] = [];

        // Copy each parent template as an individual template
        for (const parentTemplate of parentTemplates) {
            const copiedTemplate = await NotificationTemplateModel.create({
                _id: uuidv4(),
                userId,
                entityType,
                entityId,
                name: parentTemplate.name,
                description: parentTemplate.description,
                trigger: parentTemplate.trigger,
                content: parentTemplate.content,
                active: parentTemplate.active,
                inheritedFrom: parentTemplate._id,
                customized: true, // Mark as customized since it's now individual
                createdAt: new Date(),
                updatedAt: new Date()
            });

            copiedTemplates.push(copiedTemplate.toObject());
        }

        // Set sync state to false
        await this.setEntitySyncState(userId, entityType, entityId, false);

        return copiedTemplates;
    }

    /**
     * Enable sync for an entity - delete all individual templates and inherit from parent
     */
    async enableEntitySync(userId: UserId, entityType: NotificationEntityType, entityId: string): Promise<void> {
        // Delete all individual templates for this entity
        await NotificationTemplateModel.deleteMany({
            userId,
            entityType,
            entityId
        });

        // Set sync state to true
        await this.setEntitySyncState(userId, entityType, entityId, true);
    }

    /**
     * Update child templates when parent template changes
     */
    async updateChildTemplates(parentTemplateId: string): Promise<void> {
        const parentTemplate = await NotificationTemplateModel.findById(parentTemplateId);
        if (!parentTemplate) return;

        // Update all non-customized child templates
        await NotificationTemplateModel.updateMany(
            { 
                inheritedFrom: parentTemplateId, 
                customized: false 
            },
            {
                trigger: parentTemplate.trigger,
                content: parentTemplate.content,
                active: parentTemplate.active,
                updatedAt: new Date()
            }
        );
    }
}

export default NotificationTemplateManager;