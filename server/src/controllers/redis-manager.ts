import Redis from 'ioredis';
import ConfigManager from "./config-manager";

export default class RedisManager {
    private static instance: RedisManager;
    private client!: Redis;

    private constructor() {}

    static async init(): Promise<void> {
        if (RedisManager.instance) throw new Error("RedisManager is already initialized");

        RedisManager.instance = new RedisManager();
        await RedisManager.instance.connect();

        console.log('flushing redis');
        await RedisManager.instance.client.flushall();
    }

    private async connect(): Promise<void> {
        this.client = new Redis(ConfigManager.getConfig().redisUrl);

        this.client.on('error', (err) => {
            console.error('Redis Client Error', err);
        });
    }

    async disconnect(): Promise<void> {
        await this.client.quit();
    }

    getClient(): Redis {
        return this.client;
    }

    static getInstance(): RedisManager {
        if (!RedisManager.instance) throw new Error('RedisManager not initialized. Call init() first.');
        return RedisManager.instance;
    }
}