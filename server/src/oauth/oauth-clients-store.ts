import { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';
import { OAuthClientModel } from '../models/mongo/oauth-client';
import { randomUUID, randomBytes } from 'crypto';

function generateSecureClientSecret(): string {
    return randomBytes(32).toString('base64url');
}

export class MongoOAuthClientsStore implements OAuthRegisteredClientsStore {
    async getClient(clientId: string): Promise<OAuthClientInformationFull | undefined> {
        const client = await OAuthClientModel.findById(clientId).lean();
        if (!client) return undefined;

        return {
            client_id: client._id,
            client_secret: client.clientSecret,
            client_secret_expires_at: client.clientSecretExpiresAt,
            redirect_uris: client.redirectUris,
            client_name: client.clientName,
            grant_types: client.grantTypes,
            response_types: client.responseTypes,
            token_endpoint_auth_method: client.tokenEndpointAuthMethod,
            client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
        };
    }

    async registerClient(
        metadata: Omit<OAuthClientInformationFull, 'client_id' | 'client_id_issued_at'>
    ): Promise<OAuthClientInformationFull> {
        const clientId = randomUUID();
        const issuedAt = Math.floor(Date.now() / 1000);
        const authMethod = metadata.token_endpoint_auth_method;

        let clientSecret = metadata.client_secret;
        if (!clientSecret) clientSecret = generateSecureClientSecret();

        const client = new OAuthClientModel({
            _id: clientId,
            clientSecret,
            clientSecretExpiresAt: metadata.client_secret_expires_at,
            redirectUris: metadata.redirect_uris.map(uri => uri.toString()),
            clientName: metadata.client_name,
            grantTypes: metadata.grant_types || ['authorization_code', 'refresh_token'],
            responseTypes: metadata.response_types || ['code'],
            tokenEndpointAuthMethod: authMethod,
        });

        await client.save();

        return {
            ...metadata,
            client_id: clientId,
            client_id_issued_at: issuedAt,
            client_secret: clientSecret,
            token_endpoint_auth_method: authMethod,
        };
    }
}
