import {UserConfigModel} from "../models/mongo/user-config";
import {
    ThoughtData,
    ThoughtId,
    UpdateThoughtRequest,
    UpdateUserRequest,
    UserData,
    UserId
} from "@timothyw/pat-common";
import { AuthInfo } from "../api/types";
import { updateDocument } from "../utils/db-doc-utils";
import { ThoughtModel } from "../models/mongo/thought-data";

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

    async create(name: string, discordID?: string): Promise<UserData> {
        const userConfig = new UserConfigModel({
            name,
            discordID
        });
        const doc = await userConfig.save();
        return doc.toObject();
    }

    async getById(userId: UserId): Promise<UserData | null> {
        return UserConfigModel.findById(userId).lean();
    }

    async getTimezone(userId: UserId): Promise<string> {
        const user = await UserConfigModel.findById(userId).lean();
        return user?.timezone || 'America/Los_Angeles';
    }

    update(
        auth: AuthInfo,
        userId: UserId,
        updates: UpdateUserRequest
    ): Promise<UserData | null> {
        return updateDocument(auth, UserConfigModel, userId, updates);
    }

    // async update(userId: UserId, updates: UpdateUserRequest): Promise<UserData | null> {
    //     const set: Record<string, any> = {};
    //     const unset: Record<string, any> = {};
    //
    //     const flatUpdates = UserManager.flattenObject(updates);
    //
    //     Object.entries(flatUpdates).forEach(([key, value]) => {
    //         if (value === null) {
    //             unset[key] = "";
    //         } else {
    //             set[key] = value;
    //         }
    //     });
    //
    //     const updateOperation: Record<string, any> = {};
    //     if (Object.keys(set).length > 0) updateOperation.$set = set;
    //     if (Object.keys(unset).length > 0) updateOperation.$unset = unset;
    //
    //     return UserConfigModel.findByIdAndUpdate(
    //         userId,
    //         updateOperation,
    //         { new: true }
    //     ).lean();
    // }

    async delete(userId: UserId): Promise<boolean> {
        return UserConfigModel.deleteOne({ _id: userId })
            .then(result => result.deletedCount > 0);
    }

    async getAllWithNotifications(): Promise<UserData[]> {
        return UserConfigModel.find({ "sandbox.devices.0": { $exists: true } }).lean();
    }

    static getInstance(): UserManager {
        if (!UserManager.instance) UserManager.instance = new UserManager();
        return UserManager.instance;
    }
}