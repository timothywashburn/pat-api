import { createClient, RedisClientType } from 'redis';
import ConfigManager from "./config-manager";

export default class RedisManager {
    private static instance: RedisManager;
    private client!: RedisClientType;

    private constructor() {}

    static async init(): Promise<void> {
        if (RedisManager.instance) throw new Error("RedisManager is already initialized");

        RedisManager.instance = new RedisManager();
        await RedisManager.instance.connect();

        console.log('flushing redis');
        await RedisManager.instance.client.flushAll();
    }

    private async connect(): Promise<void> {
        this.client = createClient({
            url: ConfigManager.getConfig().redisUrl
        });

        this.client.on('error', (err) => {
            console.error('Redis Client Error', err);
        });

        await this.client.connect();
    }

    async disconnect(): Promise<void> {
        await this.client.quit();
    }

    getClient(): RedisClientType {
        return this.client;
    }

    static getInstance(): RedisManager {
        if (!RedisManager.instance) throw new Error('RedisManagerManager not initialized. Call init() first.');
        return RedisManager.instance;
    }
}
