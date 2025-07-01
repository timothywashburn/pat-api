import {Schema, Document, model} from 'mongoose';
import { ProgramConfigData } from "@timothyw/pat-common";
import { v4 as uuidv4 } from 'uuid';

const programConfigSchema = new Schema({
    _id: {
        type: String,
        required: true,
        default: uuidv4
    },
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
            default: 'discord_clientid'
        },
        guildId: {
            type: String,
            required: true,
            default: 'discord_guildid'
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