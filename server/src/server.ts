import express from "express";
import cors from "cors";
import Bot from "./discord/bot";
import MongoManager from "./controllers/mongo-manager";
import ApiManager from "./controllers/api-manager";
import McpManager from "./mcp/controllers/mcp-manager";
import { config } from "dotenv";
import { resolve } from "path";
import ConfigManager from "./controllers/config-manager";
import { createServer } from 'http';
import SocketManager from "./controllers/socket-manager";
import NotificationManager from "./controllers/notification-manager";
import RedisManager from "./controllers/redis-manager";
import Logger, { LogType } from "./utils/logger";
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { PatOAuthProvider } from './mcp/oauth/oauth-provider';
import { createCompleteAuthorizationRouter } from './mcp/oauth/complete-authorization';

Logger.logSystem(LogType.UNCLASSIFIED, "starting server");

config({ path: resolve(__dirname, '../../.env') });

(async () => {
    await MongoManager.getInstance().init();
    await ConfigManager.init();
    await RedisManager.init();
    await NotificationManager.init();

    const app = express();
    const server = createServer(app);

    // traefik proxy (1 hop)
    app.set('trust proxy', 1);

    // app.use((req, res, next) => {
    //     Logger.logSystem(LogType.UNCLASSIFIED, `[REQUEST] ${req.method} ${req.path}`);
    //     Logger.logSystem(LogType.UNCLASSIFIED, `[HEADERS] ${JSON.stringify(req.headers)}`);
    //     Logger.logSystem(LogType.UNCLASSIFIED, `[IP] ${req.ip} [IPs] ${JSON.stringify(req.ips)}`);
    //     Logger.logSystem(LogType.UNCLASSIFIED, `[QUERY] ${JSON.stringify(req.query)}`);
    //     next();
    // });

    // not sure if this is needed still to allow requests from web client
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

    app.use('/.well-known', express.static(resolve(__dirname, '../public/.well-known')));

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

    // app.use((err: any, req: any, res: any, next: any) => {
    //     console.error('[EXPRESS ERROR]', req.method, req.path, err.message);
    //     console.error('[EXPRESS ERROR STACK]', err.stack);
    //     if (!res.headersSent) {
    //         res.status(err.status || 500).json({ error: err.message });
    //     }
    // });

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