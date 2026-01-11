import express from "express";
import cors from "cors";
import Bot from "./discord/bot";
import MongoManager from "./controllers/mongo-manager";
import ApiManager from "./controllers/api-manager";
import McpManager from "./mcp/mcp-manager";
import { config } from "dotenv";
import { resolve } from "path";
import ConfigManager from "./controllers/config-manager";
import { createServer } from 'http';
import SocketManager from "./controllers/socket-manager";
import NotificationManager from "./controllers/notification-manager";
import RedisManager from "./controllers/redis-manager";
import Logger, { LogType } from "./utils/logger";
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { PatOAuthProvider } from './oauth/oauth-provider';
import { createCompleteAuthorizationRouter } from './oauth/complete-authorization';
import { randomUUID } from 'crypto';

Logger.logSystem(LogType.UNCLASSIFIED, "starting server");

config({ path: resolve(__dirname, '../../.env') });

(async () => {
    await MongoManager.getInstance().init();
    await ConfigManager.init();
    await RedisManager.init();
    await NotificationManager.init();

    const app = express();
    const server = createServer(app);

    // Trust proxy headers from Traefik (1 hop) for rate limiting and IP detection
    app.set('trust proxy', 1);

    // Debug logging for all requests
    app.use((req, res, next) => {
        Logger.logSystem(LogType.UNCLASSIFIED, `[REQUEST] ${req.method} ${req.path}`);
        Logger.logSystem(LogType.UNCLASSIFIED, `[HEADERS] ${JSON.stringify(req.headers)}`);
        Logger.logSystem(LogType.UNCLASSIFIED, `[IP] ${req.ip} [IPs] ${JSON.stringify(req.ips)}`);
        Logger.logSystem(LogType.UNCLASSIFIED, `[QUERY] ${JSON.stringify(req.query)}`);
        next();
    });

    // Allow requests from web client
    app.use(cors({
        origin: process.env.WEB_URL!,
        credentials: true,
    }));

    SocketManager.initialize(server);

    const baseUrl = new URL(process.env.API_URL!);
    const mcpResourceUrl = new URL('/mcp', baseUrl);
    const oauthProvider = new PatOAuthProvider(mcpResourceUrl);

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Debug middleware for /token endpoint
    app.use('/token', (req, res, next) => {
        console.log('[TOKEN DEBUG] Request body:', req.body);
        console.log('[TOKEN DEBUG] Headers:', req.headers);
        next();
    });

    // Serve static files for mobile app deep linking
    app.use('/.well-known', express.static(resolve(__dirname, '../public/.well-known')));

    // OAuth router MUST be mounted at root (SDK requirement)
    // It serves /authorize, /token, /register, /revoke, /.well-known/oauth-authorization-server
    app.use(mcpAuthRouter({
        provider: oauthProvider,
        issuerUrl: baseUrl,
        baseUrl: baseUrl,
        resourceServerUrl: mcpResourceUrl,
        scopesSupported: ['agenda:read', 'agenda:write'],
        resourceName: 'Pat MCP Server',
    }));

    app.use(createCompleteAuthorizationRouter(oauthProvider));

    app.use(ApiManager.getInstance().getRouter());
    app.use('/mcp', McpManager.initialize(oauthProvider, mcpResourceUrl, baseUrl).getRouter());

    // Error handler MUST be last
    app.use((err: any, req: any, res: any, next: any) => {
        console.error('[EXPRESS ERROR]', req.method, req.path, err.message);
        console.error('[EXPRESS ERROR STACK]', err.stack);
        if (!res.headersSent) {
            res.status(err.status || 500).json({ error: err.message });
        }
    });

    const port = 3000;
    server.listen(port, () => {
        Logger.logSystem(LogType.UNCLASSIFIED, `server listening on port ${port}`);
    });

    try {
        const bot = new Bot();
        await bot.start();
    } catch (error) {
        console.error('Failed to initialize Discord bot', error);
    }
})().catch(error => {
    console.error('Fatal server error:', error);
    process.exit(1);
});