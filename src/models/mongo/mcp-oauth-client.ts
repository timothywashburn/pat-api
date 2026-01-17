import { Schema, model } from 'mongoose';

export interface MCPOAuthClientData {
    _id: string;
    clientSecret?: string;
    clientSecretExpiresAt?: number;
    redirectUris: string[];
    clientName?: string;
    grantTypes: string[];
    responseTypes: string[];
    tokenEndpointAuthMethod: string;
    createdAt: Date;
    updatedAt: Date;
}

const oauthClientSchema = new Schema<MCPOAuthClientData>({
    _id: { type: String, required: true },
    clientSecret: String,
    clientSecretExpiresAt: Number,
    redirectUris: [{ type: String, required: true }],
    clientName: String,
    grantTypes: [{ type: String, default: ['authorization_code', 'refresh_token'] }],
    responseTypes: [{ type: String, default: ['code'] }],
    tokenEndpointAuthMethod: { type: String, default: 'none' },
}, { timestamps: true });

export const MCPOAuthClientModel = model<MCPOAuthClientData>('MCPOAuthClient', oauthClientSchema, 'mcp_oauth_clients');
