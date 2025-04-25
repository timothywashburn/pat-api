import {Types} from "mongoose";
import {UserConfigModel} from "../models/mongo/user-config";
import { UpdateUserConfigRequest, UserConfig, UserId } from "@timothyw/pat-common";

export default class UserManager {
    private static instance: UserManager;

    private constructor() {}

    private static flattenObject(obj: any, prefix = ''): Record<string, any> {
        const flattened: Record<string, any> = {};

        Object.entries(obj).forEach(([key, value]) => {
            const keyPath = prefix ? `${prefix}.${key}` : key;

            if (value && typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(flattened, UserManager.flattenObject(value, keyPath));
            } else if (value !== undefined) {
                flattened[keyPath] = value;
            }
        });

        return flattened;
    }

    async create(name: string, discordID?: string): Promise<UserConfig> {
        const userConfig = new UserConfigModel({
            name,
            discordID
        });
        return userConfig.save();
    }

    async getById(userId: UserId): Promise<UserConfig | null> {
        return UserConfigModel.findById(userId);
    }

    async update(userId: UserId, updates: UpdateUserConfigRequest): Promise<UserConfig | null> {
        const set: Record<string, any> = {};
        const unset: Record<string, any> = {};

        const flatUpdates = UserManager.flattenObject(updates);

        Object.entries(flatUpdates).forEach(([key, value]) => {
            if (value === null) {
                unset[key] = "";
            } else {
                set[key] = value;
            }
        });

        const updateOperation: Record<string, any> = {};
        if (Object.keys(set).length > 0) updateOperation.$set = set;
        if (Object.keys(unset).length > 0) updateOperation.$unset = unset;

        return UserConfigModel.findByIdAndUpdate(
            userId,
            updateOperation,
            { new: true }
        );
    }

    async delete(userId: UserId): Promise<boolean> {
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
        return UserConfigModel.find({ itemListTracking: { $exists: true, $ne: null } });
    }

    static getInstance(): UserManager {
        if (!UserManager.instance) UserManager.instance = new UserManager();
        return UserManager.instance;
    }
}