import {ProgramConfigData, ProgramConfigModel} from "../models/program-config";

export default class ConfigManager {
    private static configCache: ProgramConfigData | null;

    static async init(): Promise<void> {
        if (await ProgramConfigModel.findOne()) {
            console.log('found existing config');
        } else {
            console.log('creating new config');
            await new ProgramConfigModel().save();
        }

        await ConfigManager.refreshConfig();

        setInterval(async () => {
            try {
                await ConfigManager.refreshConfig();
            } catch (error) {
                console.error('Error refreshing config:', error);
            }
        }, 60000);
    }

    private static async refreshConfig(): Promise<void> {
        const config = await ProgramConfigModel.findOne();
        if (!config) {
            throw new Error('configuration not found during refresh');
        }
        this.configCache = config;
    }

    static getConfig(): ProgramConfigData {
        if (!ConfigManager.configCache) throw new Error('configuration not initialized');
        return ConfigManager.configCache;
    }

    async update(updates: Partial<ProgramConfigData>): Promise<ProgramConfigData | null> {
        const existing = await ProgramConfigModel.findOne();
        if (!existing) throw new Error('configuration not initialized');

        const updated = await ProgramConfigModel.findByIdAndUpdate(
            existing._id,
            { $set: updates },
            { new: true }
        );

        if (updated) ConfigManager.configCache = updated;
        return updated;
    }
}