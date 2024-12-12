import mongoose from 'mongoose';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { runCreateAccountTest } from './unit/api/create-account.test';
import { runLoginTest } from './unit/api/login.test';
import { runGetItemsTest } from './unit/api/get-items.test';
import {runSetupDiscordConfigTest} from "./unit/create-config";
import {runCreateItemsTest} from "./unit/api/create-items.test";
import {runDeleteItemTest} from "./unit/api/delete-item.test";
import {runRefreshTokenTest} from "./unit/api/refresh-token.test";
import {runCompleteItemTest} from "./unit/api/complete-item.test";
import {runUpdateUserConfigTest} from "./unit/api/update-user-config.test";
import {runGetUserConfigTest} from "./unit/api/get-user-config.test";
import {runResendVerificationTest} from "./unit/api/resend-verification.test";
import {runVerifyEmailTest} from "./unit/api/verify-email.test";
import {runUpdateItemTest} from "./unit/api/update-item.test";

config({ path: resolve(__dirname, '../../.env') });

export interface TestContext {
    baseUrl: string;
    userId?: string;
    authToken?: string;
    refreshToken?: string;
    emailVerificationToken?: string;
    itemIds?: string[];
    account: {
        name: string;
        email: string;
        password: string;
    };
}

interface Test {
    name: string;
    run: (context: TestContext) => Promise<void>;
}

const tests: Test[] = [
    { name: 'setup config', run: runSetupDiscordConfigTest },
    { name: 'create account', run: runCreateAccountTest },
    { name: 'login', run: runLoginTest },
    // { name: 'resend verification', run: runResendVerificationTest },
    { name: 'verify email', run: runVerifyEmailTest },
    { name: 'refresh token', run: runRefreshTokenTest },
    { name: 'get user config', run: runGetUserConfigTest },
    { name: 'update user config', run: runUpdateUserConfigTest },
    { name: 'create items', run: runCreateItemsTest },
    { name: 'delete item', run: runDeleteItemTest },
    { name: 'complete item', run: runCompleteItemTest },
    { name: 'update item', run: runUpdateItemTest },
    { name: 'get items', run: runGetItemsTest }
];

async function runTests() {
    const totalTests = tests.length;
    console.log('\ninitializing test environment');

    const context: TestContext = {
        baseUrl: 'https://mac.timothyw.dev',
        account: {
            name: 'Test',
            email: 'trwisinthehouse@gmail.com',
            password: 'pass'
        }
    };

    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('connected to mongodb');

        const collections = await mongoose.connection.db!.collections();
        await Promise.all(
            collections.map(collection => collection.deleteMany({}))
        );

        console.log('database cleared');

        console.log('\n----------------------------------------');
        console.log(`starting unit tester ${chalk.magenta(`(${totalTests} tests)`)}`);
        console.log('----------------------------------------\n');

        for (let i = 0; i < tests.length; i++) {
            const test = tests[i];
            try {
                await test.run(context);
                console.log(chalk.green(`  ► ${test.name} ${chalk.magenta(`(${i + 1}/${totalTests})`)}`));
            } catch (error) {
                console.log('\n----------------------------------------');
                console.log(chalk.red(`unit tester failed at: ${test.name}`));
                console.log('----------------------------------------\n');

                console.error(error);
                process.exit(1);
            }
        }

        console.log('\n----------------------------------------');
        console.log(`${chalk.green('all unit completed successfully')} ${chalk.magenta(`(${totalTests} total)`)}`)
        console.log('----------------------------------------');
    } catch (error) {
        console.log('\n----------------------------------------');
        console.log(chalk.red('unit tester failed during initialization'));
        console.log('----------------------------------------\n');
        console.error(chalk.red(error));
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

runTests().catch(console.error);