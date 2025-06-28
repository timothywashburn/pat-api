import {Schema, Document, model} from 'mongoose';
import { ProgramConfigData } from "@timothyw/pat-common";

const programConfigSchema = new Schema<ProgramConfigData>({
    _requiredBuildVersions: {
        iOS: {
            type: Number,
            required: true,
            default: 1
        },
        android: {
            type: Number,
            required: true,
            default: 1
        }
    },
    dev: {
        authorizedEmails: {
            type: [String],
            required: true,
            default: []
        }
    },
    discord: {
        token: {
            type: String,
            required: true,
            default: 'discord_bot_token'
        },
        clientId: {
            type: String,
            required: true,
            default: 'discord_client_id'
        },
        guildId: {
            type: String,
            required: true,
            default: 'discord_guild_id'
        },
        logChannelId: {
            type: String,
            required: false
        }
    },
    mailjet: {
        apiKey: {
            type: String,
            required: true,
            default: 'mailjet_api_key'
        },
        secretKey: {
            type: String,
            required: true,
            default: 'mailjet_secret_key'
        }
    },
    expo: {
        token: {
            type: String,
            required: true,
            default: 'expo_token'
        }
    },
    redisUrl: {
        type: String,
        required: true,
        default: 'redis_url'
    }
}, {
    timestamps: true,
});

export const ProgramConfigModel = model<ProgramConfigData>('ProgramConfig', programConfigSchema, 'a_program_config');