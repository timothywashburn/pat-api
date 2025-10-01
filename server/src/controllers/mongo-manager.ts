import mongoose from "mongoose";
import Logger from "../utils/logger";

export default class MongoManager {
    private static instance: MongoManager;
    private initialized: boolean = false;

    private constructor() {}

    async init(): Promise<void> {
        if (this.initialized) return;
        Logger.logSystem("connecting to mongodb server");

        try {
            await mongoose.connect(process.env.MONGODB_URI!);
            Logger.logSystem('connected to MongoDB');

            mongoose.connection.on('error', err => {
                console.error('MongoDB error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('MongoDB disconnected');
            });

            mongoose.connection.on('reconnected', () => {
                console.log('MongoDB reconnected');
            });

            this.initialized = true;
        } catch (error) {
            console.error('MongoDB connection error:', error);
            process.exit(1);
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    static getInstance(): MongoManager {
        if (!MongoManager.instance) MongoManager.instance = new MongoManager();
        return MongoManager.instance;
    }
}