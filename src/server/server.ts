import Bot from "../discordhead/bot";
import MongoManager from "./controllers/mongo-manager";
import {config} from "dotenv";
import {resolve} from "path";
import ConfigManager from "./controllers/config-manager";

console.log("starting server");

config({ path: resolve(__dirname, '../../.env') });

(async () => {
    await MongoManager.getInstance().init();
    await ConfigManager.init();
    new Bot();
})();