import {model, Schema, InferSchemaType, HydratedDocument} from "mongoose";

const userConfigSchema = new Schema({
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
    taskListTracking: {
        type: {
            channelId: {
                type: String, required: true
            },
            messageId: {
                type: String, required: true
            }
        }
    },
    iosApp: {
        type: {
            panels: [{
                type: {
                    panel: {
                        type: String,
                        enum: ['agenda', 'tasks', 'inbox', 'settings']
                    },
                    visible: {
                        type: Boolean,
                        default: true
                    }
                }
            }]
        },
        default: {
            panels: [
                { panel: 'agenda', visible: true },
                { panel: 'tasks', visible: true },
                { panel: 'inbox', visible: true },
                { panel: 'settings', visible: true }
            ]
        }
    }
}, {
    timestamps: true,
});

type UserConfig = HydratedDocument<InferSchemaType<typeof userConfigSchema>>;
const UserConfigModel = model<UserConfig>('UserConfig', userConfigSchema);

export {
    UserConfig,
    UserConfigModel
};