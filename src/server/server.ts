import express from "express";
import Bot from "../discordhead/bot";
import MongoManager from "./controllers/mongo-manager";
import ApiManager from "./controllers/api-manager";
import { config } from "dotenv";
import { resolve } from "path";
import ConfigManager from "./controllers/config-manager";

console.log("starting server");

config({ path: resolve(__dirname, '../../.env') });

const app = express();

(async () => {
    await MongoManager.getInstance().init();
    await ConfigManager.init();

    app.use(ApiManager.getInstance().getRouter());

    const port = 3000;
    app.listen(port, () => {
        console.log(`API server listening on port ${port}`);
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