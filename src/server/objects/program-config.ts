import { Schema, model, Document } from 'mongoose';

export interface ProgramConfigData extends Document {
    discord: {
        token: string;
        clientId: string;
        guildId: string;
        logChannelId?: string;
    };
    updatedAt: Date;
    createdAt: Date;
}

const programConfigSchema = new Schema<ProgramConfigData>({
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
    }
}, {
    timestamps: true,
    collection: 'general'
});

export const ProgramConfigModel = model<ProgramConfigData>('ProgramConfig', programConfigSchema);