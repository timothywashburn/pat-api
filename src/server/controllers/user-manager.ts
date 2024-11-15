import {Types} from "mongoose";
import {UserConfig, UserConfigModel} from "../models/user-config";

export default class UserManager {
    private static instance: UserManager;

    private constructor() {}

    // Create base user
    async create(username: string, discordID?: string): Promise<UserConfig> {
        const userConfig = new UserConfigModel({
            username,
            discordID
        });
        return userConfig.save();
    }

    // Get user by ID (primary method)
    async getById(userId: Types.ObjectId): Promise<UserConfig | null> {
        return UserConfigModel.findById(userId);
    }

    // Get user by Discord ID (legacy support)
    async getByDiscordID(discordID: string): Promise<UserConfig | null> {
        return UserConfigModel.findOne({ discordID });
    }

    // Update user
    async update(userId: Types.ObjectId, updates: Partial<Omit<UserConfig, '_id'>>): Promise<UserConfig | null> {
        return UserConfigModel.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true }
        );
    }

    // Delete user
    async delete(userId: Types.ObjectId): Promise<boolean> {
        return UserConfigModel.deleteOne({ _id: userId })
            .then(result => result.deletedCount > 0);
    }

    // Legacy support for Discord commands
    async discordExists(discordID: string): Promise<boolean> {
        return UserConfigModel.exists({ discordID })
            .then(result => result !== null);
    }

    async getAllWithTracking(): Promise<UserConfig[]> {
        return UserConfigModel.find({ taskListTracking: { $exists: true, $ne: null } });
    }

    static getInstance(): UserManager {
        if (!UserManager.instance) UserManager.instance = new UserManager();
        return UserManager.instance;
    }
}