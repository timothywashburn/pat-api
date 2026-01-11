import { Response } from 'express';
import { randomUUID, randomBytes } from 'crypto';
import { OAuthServerProvider, AuthorizationParams } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import { OAuthClientInformationFull, OAuthTokens, OAuthTokenRevocationRequest } from '@modelcontextprotocol/sdk/shared/auth.js';
import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { checkResourceAllowed } from '@modelcontextprotocol/sdk/shared/auth-utils.js';
import { InvalidTokenError, InvalidGrantError, InvalidScopeError } from '@modelcontextprotocol/sdk/server/auth/errors.js';
import { MongoOAuthClientsStore } from './oauth-clients-store';
import { OAuthAuthorizationCodeModel } from '../models/mongo/oauth-authorization-code';
import { OAuthTokenModel } from '../models/mongo/oauth-token';
import { UserId } from '@timothyw/pat-common';
import RedisManager from '../controllers/redis-manager';

interface SerializablePendingAuth {
    clientId: string;
    clientName?: string;
    redirectUri: string;
    codeChallenge: string;
    codeChallengeMethod: string;
    scopes: string[];
    state?: string;
    resource?: string;
}

const PENDING_AUTH_TTL_SECONDS = 10 * 60;

function generateSecureToken(): string {
    return randomBytes(32).toString('base64url');
}

export class PatOAuthProvider implements OAuthServerProvider {
    public readonly clientsStore = new MongoOAuthClientsStore();
    private readonly resourceServerUrl: URL;

    constructor(resourceServerUrl: URL) {
        this.resourceServerUrl = resourceServerUrl;
    }

    private async storePendingAuth(
        pendingId: string,
        client: OAuthClientInformationFull,
        params: AuthorizationParams
    ): Promise<void> {
        const data: SerializablePendingAuth = {
            clientId: client.client_id,
            clientName: client.client_name,
            redirectUri: params.redirectUri,
            codeChallenge: params.codeChallenge,
            codeChallengeMethod: 'S256',
            scopes: params.scopes || [],
            state: params.state,
            resource: params.resource?.toString(),
        };
        const redis = RedisManager.getInstance().getClient();
        await redis.setex(`oauth:pending:${pendingId}`, PENDING_AUTH_TTL_SECONDS, JSON.stringify(data));
    }

    private async getPendingAuth(pendingId: string): Promise<SerializablePendingAuth | null> {
        const redis = RedisManager.getInstance().getClient();
        const data = await redis.get(`oauth:pending:${pendingId}`);
        if (!data) return null;
        return JSON.parse(data);
    }

    private async deletePendingAuth(pendingId: string): Promise<void> {
        const redis = RedisManager.getInstance().getClient();
        await redis.del(`oauth:pending:${pendingId}`);
    }

    async completeAuthorization(
        pendingId: string,
        userId: UserId
    ): Promise<{ redirectUrl: string } | null> {
        const pending = await this.getPendingAuth(pendingId);
        if (!pending) return null;

        const code = generateSecureToken();

        await new OAuthAuthorizationCodeModel({
            _id: code,
            clientId: pending.clientId,
            userId: userId.toString(),
            redirectUri: pending.redirectUri,
            codeChallenge: pending.codeChallenge,
            codeChallengeMethod: pending.codeChallengeMethod,
            scopes: pending.scopes,
            resource: pending.resource,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        }).save();

        await this.deletePendingAuth(pendingId);

        const redirectUrl = new URL(pending.redirectUri);
        redirectUrl.searchParams.set('code', code);
        if (pending.state) {
            redirectUrl.searchParams.set('state', pending.state);
        }

        return { redirectUrl: redirectUrl.toString() };
    }

    async authorize(
        client: OAuthClientInformationFull,
        params: AuthorizationParams,
        res: Response
    ): Promise<void> {
        try {
            console.log('[AUTHORIZE] Starting authorization flow', {
                clientId: client.client_id,
                clientName: client.client_name,
                redirectUri: params.redirectUri,
                scopes: params.scopes,
                webUrl: process.env.WEB_URL
            });

            const pendingId = randomUUID();
            await this.storePendingAuth(pendingId, client, params);

            const consentUrl = new URL('/oauth/consent', process.env.WEB_URL!);
            consentUrl.searchParams.set('pending_id', pendingId);
            consentUrl.searchParams.set('client_name', client.client_name || 'Unknown');
            consentUrl.searchParams.set('scopes', (params.scopes || []).join(','));
            consentUrl.searchParams.set('redirect_uri', params.redirectUri);
            if (params.state) {
                consentUrl.searchParams.set('state', params.state);
            }

            console.log('[AUTHORIZE] Redirecting to consent page:', consentUrl.toString());
            res.redirect(consentUrl.toString());
        } catch (error) {
            console.error('[AUTHORIZE] Error during authorization:', error);
            throw error;
        }
    }

    async challengeForAuthorizationCode(
        client: OAuthClientInformationFull,
        authorizationCode: string
    ): Promise<string> {
        console.log('[PKCE CHALLENGE] Looking up code:', authorizationCode);
        const code = await OAuthAuthorizationCodeModel.findById(authorizationCode).lean();
        if (!code || code.clientId !== client.client_id) {
            console.error('[PKCE CHALLENGE] Code not found or client mismatch');
            throw new InvalidGrantError('Invalid authorization code');
        }
        console.log('[PKCE CHALLENGE] Returning challenge:', code.codeChallenge);
        return code.codeChallenge;
    }

    async exchangeAuthorizationCode(
        client: OAuthClientInformationFull,
        authorizationCode: string,
        _codeVerifier?: string,
        redirectUri?: string,
        resource?: URL
    ): Promise<OAuthTokens> {
        console.log('[TOKEN EXCHANGE] Starting token exchange', {
            clientId: client.client_id,
            clientName: client.client_name,
            authorizationCode,
            redirectUri,
            resource: resource?.toString(),
        });

        const code = await OAuthAuthorizationCodeModel.findById(authorizationCode);
        if (!code) {
            console.error('[TOKEN EXCHANGE] Authorization code not found:', authorizationCode);
            throw new InvalidGrantError('Invalid authorization code');
        }
        console.log('[TOKEN EXCHANGE] Code found', {
            clientId: code.clientId,
            userId: code.userId,
            redirectUri: code.redirectUri,
            resource: code.resource,
            expiresAt: code.expiresAt,
        });

        if (code.clientId !== client.client_id) {
            console.error('[TOKEN EXCHANGE] Client ID mismatch', {
                expected: code.clientId,
                actual: client.client_id,
            });
            throw new InvalidGrantError('Authorization code was not issued to this client');
        }
        if (new Date() > code.expiresAt) {
            console.error('[TOKEN EXCHANGE] Authorization code expired');
            await OAuthAuthorizationCodeModel.deleteOne({ _id: authorizationCode });
            throw new InvalidGrantError('Authorization code expired');
        }

        if (redirectUri && redirectUri !== code.redirectUri) {
            console.error('[TOKEN EXCHANGE] Redirect URI mismatch', {
                expected: code.redirectUri,
                actual: redirectUri,
            });
            throw new InvalidGrantError('Redirect URI mismatch');
        }

        const resourceStr = resource?.toString();
        if (resourceStr && code.resource && resourceStr !== code.resource) {
            console.error('[TOKEN EXCHANGE] Resource mismatch', {
                expected: code.resource,
                actual: resourceStr,
            });
            throw new InvalidGrantError('Resource mismatch: token exchange resource must match authorization request');
        }

        // Use the resource from the authorization code (what was originally requested)
        const finalResource = code.resource;
        if (!finalResource) {
            console.error('[TOKEN EXCHANGE] Authorization code missing resource indicator');
            throw new InvalidGrantError('Authorization code missing resource indicator');
        }

        console.log('[TOKEN EXCHANGE] Validation passed, creating tokens');

        await OAuthAuthorizationCodeModel.deleteOne({ _id: authorizationCode });

        const accessToken = generateSecureToken();
        const refreshToken = generateSecureToken();

        const accessExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
        const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await OAuthTokenModel.insertMany([
            {
                _id: accessToken,
                type: 'access',
                clientId: client.client_id,
                userId: code.userId,
                scopes: code.scopes,
                resource: finalResource,
                expiresAt: accessExpiresAt,
            },
            {
                _id: refreshToken,
                type: 'refresh',
                clientId: client.client_id,
                userId: code.userId,
                scopes: code.scopes,
                resource: finalResource,
                expiresAt: refreshExpiresAt,
            },
        ]);

        console.log('[TOKEN EXCHANGE] Tokens created successfully', {
            userId: code.userId,
            scopes: code.scopes,
        });

        return {
            access_token: accessToken,
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: refreshToken,
            scope: code.scopes.join(' '),
        };
    }

    async exchangeRefreshToken(
        client: OAuthClientInformationFull,
        refreshToken: string,
        scopes?: string[],
        resource?: URL
    ): Promise<OAuthTokens> {
        const token = await OAuthTokenModel.findOne({
            _id: refreshToken,
            type: 'refresh',
            clientId: client.client_id,
        });

        if (!token || new Date() > token.expiresAt) {
            throw new InvalidGrantError('Invalid or expired refresh token');
        }

        let finalScopes = token.scopes;
        if (scopes && scopes.length > 0) {
            const originalScopesSet = new Set(token.scopes);
            const invalidScopes = scopes.filter(s => !originalScopesSet.has(s));
            if (invalidScopes.length > 0)
                throw new InvalidScopeError(`Requested scopes exceed original grant: ${invalidScopes.join(', ')}`);
            finalScopes = scopes;
        }

        const resourceStr = resource?.toString();
        if (resourceStr && token.resource && resourceStr !== token.resource)
            throw new InvalidGrantError('Resource mismatch: cannot change resource on token refresh');

        const newAccessToken = generateSecureToken();
        const accessExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await new OAuthTokenModel({
            _id: newAccessToken,
            type: 'access',
            clientId: client.client_id,
            userId: token.userId,
            scopes: finalScopes,
            resource: token.resource,
            expiresAt: accessExpiresAt,
        }).save();

        return {
            access_token: newAccessToken,
            token_type: 'bearer',
            expires_in: 3600,
            scope: finalScopes.join(' '),
        };
    }

    async verifyAccessToken(token: string): Promise<AuthInfo> {
        const tokenData = await OAuthTokenModel.findOne({
            _id: token,
            type: 'access',
        }).lean();

        if (!tokenData || new Date() > tokenData.expiresAt) throw new InvalidTokenError('Invalid or expired access token');
        if (!tokenData.resource) throw new InvalidTokenError('Token missing resource indicator');

        const isAllowed = checkResourceAllowed({
            requestedResource: tokenData.resource,
            configuredResource: this.resourceServerUrl,
        });

        if (!isAllowed) throw new InvalidTokenError(
            `Token not valid for this resource server. Expected ${this.resourceServerUrl}, got ${tokenData.resource}`
        );

        return {
            token,
            clientId: tokenData.clientId,
            scopes: tokenData.scopes,
            expiresAt: Math.floor(tokenData.expiresAt.getTime() / 1000),
            resource: new URL(tokenData.resource),
            extra: {
                userId: tokenData.userId,
            },
        };
    }

    async revokeToken(
        client: OAuthClientInformationFull,
        request: OAuthTokenRevocationRequest
    ): Promise<void> {
        await OAuthTokenModel.deleteOne({
            _id: request.token,
            clientId: client.client_id,
        });
    }
}
