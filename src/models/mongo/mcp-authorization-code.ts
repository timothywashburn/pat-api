import { Schema, model } from 'mongoose';

export interface MCPAuthorizationCodeData {
    _id: string;
    clientId: string;
    userId: string;
    redirectUri: string;
    codeChallenge: string;
    codeChallengeMethod: string;
    scopes: string[];
    resource?: string;
    expiresAt: Date;
    createdAt: Date;
}

const schema = new Schema<MCPAuthorizationCodeData>({
    _id: { type: String, required: true },
    clientId: { type: String, required: true },
    userId: { type: String, required: true },
    redirectUri: { type: String, required: true },
    codeChallenge: { type: String, required: true },
    codeChallengeMethod: { type: String, default: 'S256' },
    scopes: [String],
    resource: String,
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

export const MCPAuthorizationCodeModel = model<MCPAuthorizationCodeData>(
    'MCPAuthorizationCode', schema, 'mcp_authorization_codes'
);
