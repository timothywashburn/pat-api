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