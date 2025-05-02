import { model, Schema, InferSchemaType, HydratedDocument, Types } from "mongoose";
import { ModuleType, UserData } from "@timothyw/pat-common";

const userDataSchema = new Schema<UserData>({
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
            modules: [{
                type: {
                    type: String,
                    enum: Object.values(ModuleType),
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
            modules: Object.values(ModuleType).map(type => ({ type, visible: true })),
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

export const UserConfigModel = model<UserData>('User', userDataSchema);