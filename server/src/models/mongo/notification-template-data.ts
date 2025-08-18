import { Schema, model } from 'mongoose';
import {
    NotificationEntityType,
    NotificationTemplateData,
    NotificationTemplateLevel,
    NotificationTriggerType,
} from "@timothyw/pat-common";
import { v4 as uuidv4 } from 'uuid';

const triggerSchema = new Schema({
    type: {
        type: String,
        enum: Object.values(NotificationTriggerType),
        required: true
    }
}, { _id: false });

const notificationTemplateSchema = new Schema<NotificationTemplateData>({
    _id: {
        type: String,
        required: true,
        default: uuidv4
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    targetLevel: { // template is either at parent level or entity level
        type: String,
        enum: Object.values(NotificationTemplateLevel),
        required: true,
        index: true,
    },
    targetEntityType: { // for parents the entity type of the child so it can fetch them, for entities so they can fetch themselves
        type: String,
        enum: Object.values(NotificationEntityType),
        required: true,
        index: true
    },
    targetId: { // either a composite id if TargetType.PARENT like agenda could have {entityType}_category, otherwise _id of the entity
        type: String,
        required: true,
        index: true
    },
    // entityType: { // the type of entity this template applies to
    //     type: String,
    //     required: true,
    //     index: true
    // },
    // entityId: { // some entities have associated data, this id references that
    //     type: String,
    //     index: true,
    // },
    trigger: {
        type: triggerSchema,
        required: true
    },
    active: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
});

// Compound indexes for efficient queries
notificationTemplateSchema.index({ userId: 1, entityType: 1, active: 1 });
notificationTemplateSchema.index({ userId: 1, entityId: 1, active: 1 });

export const NotificationTemplateModel = model<NotificationTemplateData>('NotificationTemplate', notificationTemplateSchema, 'notification_templates');