import {ProgramConfigModel} from "../../src/server/models/mongo/program-config";
import {TestContext} from '../main';

export async function runSetupDiscordConfigTest(context: TestContext) {
    const config = await ProgramConfigModel.create({
        discord: {
            token: process.env.DISCORD_TOKEN!,
            clientId: '1084621905606217778',
            guildId: '686716838973145100'
        }
    });

    if (!config) throw new Error('failed to setup discord config');
}