import {model, Schema, Types} from "mongoose";

interface UserConfig {
    _id: Types.ObjectId;
    username: string;
    discordID?: string;  // Optional, will be deprecated
    timezone: string;
    taskListTracking?: {
        channelId: string;
        messageId: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const userConfigSchema = new Schema<UserConfig>({
    username: {
        type: String,
        required: true,
        index: true
    },
    discordID: {
        type: String,
        sparse: true,
        index: true
    },
    timezone: {
        type: String,
        default: 'America/Los_Angeles',
        validate: {
            validator: function(v: string) {
                try {
                    Intl.DateTimeFormat(undefined, { timeZone: v });
                    return true;
                } catch (e) {
                    return false;
                }
            },
            message: 'Invalid timezone'
        }
    },
    taskListTracking: {
        channelId: String,
        messageId: String
    }
}, {
    timestamps: true,
});

const UserConfigModel = model<UserConfig>('UserConfig', userConfigSchema);

export {
    UserConfig,
    UserConfigModel
};