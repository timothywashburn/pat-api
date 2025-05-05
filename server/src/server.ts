import express from "express";
import Bot from "./discord/bot";
import MongoManager from "./controllers/mongo-manager";
import ApiManager from "./controllers/api-manager";
import { config } from "dotenv";
import { resolve } from "path";
import ConfigManager from "./controllers/config-manager";
import { createServer } from 'http';
import SocketManager from "./controllers/socket-manager";
import NotificationManager from "./controllers/notification-manager";
import RedisManager from "./controllers/redis-manager";

console.log("starting server");

config({ path: resolve(__dirname, '../../.env') });

(async () => {
    await MongoManager.getInstance().init();
    await ConfigManager.init();
    await RedisManager.init();
    await NotificationManager.init();

    const app = express();
    const server = createServer(app);

    SocketManager.initialize(server);

    app.use(ApiManager.getInstance().getRouter());

    if (process.env.NODE_ENV === 'development') {
        const { createProxyMiddleware } = require('http-proxy-middleware');
        app.use(createProxyMiddleware({
            target: 'http://localhost:3001',
            changeOrigin: true,
            ws: true
        }));
    } else if (process.env.NODE_ENV === 'production') {
        // app.use(express.static(resolve(__dirname, '../../client/build')));
        // app.get('*', (req, res) => {
        //     res.sendFile(resolve(__dirname, '../../client/build/index.html'));
        // });

        const appDir = resolve(__dirname, '../../app');
        console.log(`serving webapp build from ${appDir}`);

        app.use(express.static(appDir));
        app.get('*', (req, res) => {
            res.sendFile(resolve(appDir, 'index.html'));
        });
    }

    const port = 3000;
    server.listen(port, () => {
        console.log(`server listening on port ${port}`);
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