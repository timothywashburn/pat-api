import { model, Schema } from "mongoose";
import { ModuleType, UserData } from "@timothyw/pat-common";
import { v4 as uuidv4 } from 'uuid';

const userDataSchema = new Schema<UserData>({
    _id: {
        type: String,
        required: true,
        default: uuidv4
    },
    sandbox: {
        type: {
            discordId: {
                type: String,
                index: true,
                sparse: true
            },
            devices: [{
                pushToken: {
                    type: String,
                    required: true
                }
            }]
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

export const UserConfigModel = model<UserData>('User', userDataSchema, 'users');