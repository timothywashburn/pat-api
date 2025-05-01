import { model, Schema, InferSchemaType, HydratedDocument, Types } from "mongoose";
import { PanelType, UserData } from "@timothyw/pat-common";

const userConfigSchema = new Schema<UserData>({
    sandbox: {
        type: {
            discordId: {
                type: String,
                index: true,
                sparse: true
            },
        },
        default: {}
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    timezone: {
        type: String,
        default: 'America/Los_Angeles'
    },
    config: {
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
            agenda: {
                type: {
                    itemCategories: [{
                        type: String,
                        trim: true
                    }],
                    itemTypes: [{
                        type: String,
                        trim: true
                    }],
                }
            },
            people: {
                type: {
                    propertyKeys: [{
                        type: String,
                        trim: true
                    }]
                }
            }
        },
        default: {
            panels: Object.values(PanelType).map(type => ({ type, visible: true })),
            agenda: {
                itemCategories: ['School', 'Work', 'Personal'],
                itemTypes: ['Assignment', 'Project']
            },
            people: {
                propertyKeys: ['Email', 'Phone', 'Company', 'Title']
            }
        }
    }
}, {
    timestamps: true,
});

export const UserConfigModel = model<UserData>('UserConfig', userConfigSchema);