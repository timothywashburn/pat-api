import { Schema, model } from 'mongoose';
import { NotificationTemplateData } from "@timothyw/pat-common";
import { v4 as uuidv4 } from 'uuid';

const notificationTriggerSchema = new Schema({
    type: {
        type: String,
        enum: ['time_based', 'event_based', 'recurring'],
        required: true
    },
    conditions: {
        type: Schema.Types.Mixed,
        required: true,
        default: {}
    },
    timing: {
        type: Schema.Types.Mixed,
        required: true,
        default: {}
    }
}, { _id: false });

const notificationContentSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    body: {
        type: String,
        required: true,
        trim: true
    },
    variables: {
        type: Map,
        of: String,
        default: new Map()
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
    entityType: {
        type: String,
        enum: [
            // Individual entity types (notifications FOR the entity itself)
            'agenda', 'tasks', 'habits', 'inbox',
            'agenda_item', 'task_list', 'task', 'habit',
            
            // Parent template types (default templates for children)
            'agenda_defaults', 'tasks_defaults', 'habits_defaults'
        ],
        required: true,
        index: true
    },
    entityId: {
        type: String,
        index: true,
        sparse: true // allows null/undefined values to be indexed
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    trigger: {
        type: notificationTriggerSchema,
        required: true
    },
    content: {
        type: notificationContentSchema,
        required: true
    },
    active: {
        type: Boolean,
        default: true,
        index: true
    },
    inheritedFrom: {
        type: String,
        index: true,
        sparse: true
    },
    customized: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true,
});

// Compound indexes for efficient queries
notificationTemplateSchema.index({ userId: 1, entityType: 1, active: 1 });
notificationTemplateSchema.index({ userId: 1, entityId: 1, active: 1 });
notificationTemplateSchema.index({ inheritedFrom: 1 });

export const NotificationTemplateModel = model<NotificationTemplateData>('NotificationTemplate', notificationTemplateSchema, 'notification_templates');