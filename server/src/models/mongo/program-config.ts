import {Schema, Document, model} from 'mongoose';

interface ProgramConfigData extends Document {
    dev: {
        authorizedEmails: string[]
    };
    discord: {
        token: string;
        clientId: string;
        guildId: string;
        logChannelId?: string;
    };
    mailjet: {
        apiKey: string;
        secretKey: string;
    };
    updatedAt: Date;
    createdAt: Date;
}

const programConfigSchema = new Schema<ProgramConfigData>({
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
    }
}, {
    timestamps: true,
    collection: 'general'
});

const ProgramConfigModel = model<ProgramConfigData>('ProgramConfig', programConfigSchema);

export {
    ProgramConfigData,
    ProgramConfigModel,
};