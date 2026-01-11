import { Schema, model } from 'mongoose';

export interface OAuthClientData {
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

const oauthClientSchema = new Schema<OAuthClientData>({
    _id: { type: String, required: true },
    clientSecret: String,
    clientSecretExpiresAt: Number,
    redirectUris: [{ type: String, required: true }],
    clientName: String,
    grantTypes: [{ type: String, default: ['authorization_code', 'refresh_token'] }],
    responseTypes: [{ type: String, default: ['code'] }],
    tokenEndpointAuthMethod: { type: String, default: 'none' },
}, { timestamps: true });

export const OAuthClientModel = model<OAuthClientData>('OAuthClient', oauthClientSchema, 'oauth_clients');
