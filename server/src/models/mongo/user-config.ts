import {model, Schema, InferSchemaType, HydratedDocument} from "mongoose";
import {PANEL_TYPES} from "../panels";

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
                    panel: {
                        type: String,
                        enum: PANEL_TYPES,
                        required: true
                    },
                    visible: {
                        type: Boolean,
                        required: true,
                        default: true
                    }
                }
            }],
            itemCategories: [{
                type: String,
                trim: true
            }],
            itemTypes: [{
                type: String,
                trim: true
            }]
        },
        default: {
            panels: PANEL_TYPES.map(panel => ({ panel, visible: true })),
            itemCategories: ['School', 'Work', 'Personal'],
            itemTypes: ['Assignment', 'Project']
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