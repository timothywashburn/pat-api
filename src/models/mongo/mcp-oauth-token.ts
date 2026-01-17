import { Schema, model } from 'mongoose';

export interface MCPOAuthTokenData {
    _id: string;
    type: 'access' | 'refresh';
    clientId: string;
    userId: string;
    scopes: string[];
    resource?: string;
    expiresAt: Date;
    createdAt: Date;
}

const schema = new Schema<MCPOAuthTokenData>({
    _id: { type: String, required: true },
    type: { type: String, enum: ['access', 'refresh'], required: true },
    clientId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    scopes: [String],
    resource: String,
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

schema.index({ userId: 1, clientId: 1 });

export const MCPOAuthTokenModel = model<MCPOAuthTokenData>('MCPOAuthToken', schema, 'mcp_oauth_tokens');
