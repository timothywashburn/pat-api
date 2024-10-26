import {UserConfig, UserConfigModel} from "../objects/user-config";

export default class UserManager {
    private static instance: UserManager;

    private constructor() {}

    create(username: string, discordID: number): Promise<UserConfig> {
        const userConfig = new UserConfigModel({
            username,
            discordID
        });
        return userConfig.save();
    }

    getByDiscordID(discordID: number): Promise<UserConfig | null> {
        return UserConfigModel.findOne({ discordID });
    }

    update(discordID: number, updates: Partial<UserConfig>): Promise<UserConfig | null> {
        return UserConfigModel.findOneAndUpdate(
            { discordID },
            { $set: updates },
            { new: true }
        );
    }

    delete(discordID: number): Promise<boolean> {
        return UserConfigModel.deleteOne({ discordID })
            .then(result => result.deletedCount > 0);
    }

    exists(discordID: number): Promise<boolean> {
        return UserConfigModel.exists({ discordID })
            .then(result => result !== null);
    }

    static getInstance(): UserManager {
        if (!UserManager.instance) UserManager.instance = new UserManager();
        return UserManager.instance;
    }
}