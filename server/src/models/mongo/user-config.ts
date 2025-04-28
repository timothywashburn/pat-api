import { model, Schema, InferSchemaType, HydratedDocument, Types } from "mongoose";
import { PanelType, UserConfig } from "@timothyw/pat-common";

const userConfigSchema = new Schema<UserConfig>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    timezone: {
        type: String,
        default: 'America/Los_Angeles'
    },
    discordID: {
        type: String,
        sparse: true,
        index: true
    },
    itemListTracking: {
        type: {
            channelId: {
                type: String,
                required: true
            },
            messageId: {
                type: String,
                required: true
            }
        }
    },
    iosApp: {
        type: {
            panels: [{
                type: {
                    type: String,
                    enum: Object.values(PanelType),
                    required: true
                },
                visible: {
                    type: Boolean,
                    required: true,
                    default: true
                }
            }],
            itemCategories: [{
                type: String,
                trim: true
            }],
            itemTypes: [{
                type: String,
                trim: true
            }],
            propertyKeys: [{
                type: String,
                trim: true
            }]
        },
        default: {
            panels: Object.values(PanelType).map(type => ({ type, visible: true })),
            itemCategories: ['School', 'Work', 'Personal'],
            itemTypes: ['Assignment', 'Project'],
            propertyKeys: ['Email', 'Phone', 'Company', 'Title']
        }
    }
}, {
    timestamps: true,
});

export const UserConfigModel = model<UserConfig>('UserConfig', userConfigSchema);