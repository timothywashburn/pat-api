import { Schema, model } from 'mongoose';

export interface OAuthAuthorizationCodeData {
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

const schema = new Schema<OAuthAuthorizationCodeData>({
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

export const OAuthAuthorizationCodeModel = model<OAuthAuthorizationCodeData>(
    'OAuthAuthorizationCode', schema, 'oauth_authorization_codes'
);
