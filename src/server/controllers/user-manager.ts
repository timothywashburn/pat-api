import {UserConfig, UserConfigModel} from "../objects/user-config";

export default class UserManager {
    private static instance: UserManager;

    private constructor() {}

    create(username: string, discordID: string): Promise<UserConfig> {
        const userConfig = new UserConfigModel({
            username,
            discordID
        });
        return userConfig.save();
    }

    getByDiscordID(discordID: string): Promise<UserConfig | null> {
        return UserConfigModel.findOne({ discordID });
    }

    update(discordID: string, updates: Partial<UserConfig>): Promise<UserConfig | null> {
        return UserConfigModel.findOneAndUpdate(
            { discordID },
            { $set: updates },
            { new: true }
        );
    }

    delete(discordID: string): Promise<boolean> {
        return UserConfigModel.deleteOne({ discordID })
            .then(result => result.deletedCount > 0);
    }

    exists(discordID: string): Promise<boolean> {
        return UserConfigModel.exists({ discordID })
            .then(result => result !== null);
    }

    static getInstance(): UserManager {
        if (!UserManager.instance) UserManager.instance = new UserManager();
        return UserManager.instance;
    }
}