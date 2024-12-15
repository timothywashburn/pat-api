import mongoose from 'mongoose';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { runCreateAccountTest } from './unit/api/auth/register.test';
import { runLoginTest } from './unit/api/auth/login.test';
import { runGetItemsTest } from './unit/api/items/get-items.test';
import { runSetupDiscordConfigTest } from "./unit/create-config";
import { runCreateItemsTest } from "./unit/api/items/create-items.test";
import { runDeleteItemTest } from "./unit/api/items/delete-item.test";
import { runRefreshTokenTest } from "./unit/api/auth/refresh-auth.test";
import { runCompleteItemTest } from "./unit/api/items/complete-item.test";
import { runUpdateUserConfigTest } from "./unit/api/account/update-user-config.test";
import { runGetUserConfigTest } from "./unit/api/account/get-user-config.test";
import { runResendVerificationTest } from "./unit/api/auth/resend-verification.test";
import { runVerifyEmailTest } from "./unit/api/auth/verify-email.test";
import { runUpdateItemTest } from "./unit/api/items/update-item.test";
import { runCreateThoughtsTest } from './unit/api/thoughts/create-thoughts.test';
import { runDeleteThoughtTest } from './unit/api/thoughts/delete-thought.test';
import { runUpdateThoughtTest } from './unit/api/thoughts/update-thought.test';
import { runGetThoughtsTest } from './unit/api/thoughts/get-thoughts.test';
import {runCreatePeopleTest} from "./unit/api/person/create-people.test";
import {runDeletePersonTest} from "./unit/api/person/delete-person.test";
import {runUpdatePersonTest} from "./unit/api/person/update-person.test";
import {runGetPeopleTest} from "./unit/api/person/get-people.test";

config({ path: resolve(__dirname, '../../.env') });

export interface TestContext {
    baseUrl: string;
    userId?: string;
    authToken?: string;
    refreshToken?: string;
    emailVerificationToken?: string;
    itemIds?: string[];
    thoughtIds?: string[];
    personIds?: string[];
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
    { name: 'get items', run: runGetItemsTest },

    { name: 'create thoughts', run: runCreateThoughtsTest },
    { name: 'delete thought', run: runDeleteThoughtTest },
    { name: 'update thought', run: runUpdateThoughtTest },
    { name: 'get thoughts', run: runGetThoughtsTest },

    { name: 'create people', run: runCreatePeopleTest },
    { name: 'delete person', run: runDeletePersonTest },
    { name: 'update person', run: runUpdatePersonTest },
    { name: 'get people', run: runGetPeopleTest }
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