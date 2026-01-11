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

    // Mount OAuth endpoints under /mcp prefix (so /mcp/authorize, /mcp/token, etc.)
    const oauthBasePath = '/mcp';
    const oauthBaseUrl = new URL(oauthBasePath, baseUrl);

    app.use(oauthBasePath, mcpAuthRouter({
        provider: oauthProvider,
        issuerUrl: oauthBaseUrl,
        baseUrl: oauthBaseUrl,
        resourceServerUrl: mcpResourceUrl,
        scopesSupported: ['agenda:read', 'agenda:write'],
        resourceName: 'Pat MCP Server',
    }));

    app.use(oauthBasePath, createCompleteAuthorizationRouter(oauthProvider));

    app.use(ApiManager.getInstance().getRouter());
    app.use('/mcp', McpManager.initialize(oauthProvider, mcpResourceUrl, baseUrl).getRouter());

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