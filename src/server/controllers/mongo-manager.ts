import mongoose from "mongoose";

export default class MongoManager {
    private static instance: MongoManager;
    private initialized: boolean = false;

    private constructor() {}

    async init(): Promise<void> {
        if (this.initialized) return;

        try {
            await mongoose.connect('mongodb://localhost:27017/planner-and-tracker');
            console.log('Connected to MongoDB');

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