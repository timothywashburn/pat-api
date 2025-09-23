import { Schema, model } from 'mongoose';
import {
    NotificationEntityType,
    NotificationTemplateData,
    NotificationTemplateLevel,
    NotificationSchedulerType, NotificationDesyncData,
} from "@timothyw/pat-common";
import { v4 as uuidv4 } from 'uuid';

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
    schedulerData: {
        type: new Schema({
            type: {
                type: String,
                enum: Object.values(NotificationSchedulerType),
                required: true
            },
            days: [Number],
            time: String,
            date: String,
            offsetMinutes: Number
        }),
        required: true
    },
    variantData: {
        type: Schema.Types.Mixed
    },
    active: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
});

notificationTemplateSchema.index({ userId: 1, entityType: 1, active: 1 });
notificationTemplateSchema.index({ userId: 1, entityId: 1, active: 1 });

const notificationDesyncSchema = new Schema<NotificationDesyncData>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    entityId: {
        type: String,
        required: true,
        index: true
    },
}, {
    timestamps: true,
});

export const NotificationTemplateModel = model<NotificationTemplateData>('NotificationTemplate', notificationTemplateSchema, 'notification_templates');
export const NotificationDesyncModel = model<NotificationDesyncData>('NotificationDesync', notificationDesyncSchema, 'notification_desyncs');