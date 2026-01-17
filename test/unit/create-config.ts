import {ProgramConfigModel} from "../../src/models/mongo/program-config";
import {TestContext} from '../main';

export async function runCreateConfigTest(context: TestContext) {
    const config = await ProgramConfigModel.create({
        dev: {
            authorizedEmails: [
                context.account.email,
                "test@test.com"
            ]
        },
        discord: {
            token: process.env.DISCORD_TOKEN!,
            clientId: '1084621905606217778',
            guildId: '686716838973145100'
        },
        mailjet: {
            apiKey: process.env.MAILJET_API_KEY,
            secretKey: process.env.MAILJET_SECRET_KEY
        },
        expo: {
            token: process.env.EXPO_TOKEN
        }
    });

    if (!config) throw new Error('failed to setup discord config');
}