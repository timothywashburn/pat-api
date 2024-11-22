import {Types} from "mongoose";
import {UserConfig, UserConfigModel} from "../models/user-config";
import {UpdateUserConfigRequest} from "../api/endpoints/update-user-config";

export default class UserManager {
    private static instance: UserManager;

    private constructor() {}

    async create(name: string, discordID?: string): Promise<UserConfig> {
        const userConfig = new UserConfigModel({
            name,
            discordID
        });
        return userConfig.save();
    }

    async getById(userId: Types.ObjectId): Promise<UserConfig | null> {
        return UserConfigModel.findById(userId);
    }

    async update(userId: Types.ObjectId, updates: UpdateUserConfigRequest): Promise<UserConfig | null> {
        return UserConfigModel.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true }
        );
    }

    async delete(userId: Types.ObjectId): Promise<boolean> {
        return UserConfigModel.deleteOne({ _id: userId })
            .then(result => result.deletedCount > 0);
    }

    // Legacy support for Discord commands
    async discordExists(discordID: string): Promise<boolean> {
        return UserConfigModel.exists({ discordID })
            .then(result => result !== null);
    }
    async getByDiscordID(discordID: string): Promise<UserConfig | null> {
        return UserConfigModel.findOne({ discordID });
    }
    async getAllWithTracking(): Promise<UserConfig[]> {
        return UserConfigModel.find({ taskListTracking: { $exists: true, $ne: null } });
    }

    static getInstance(): UserManager {
        if (!UserManager.instance) UserManager.instance = new UserManager();
        return UserManager.instance;
    }
}