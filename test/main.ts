import mongoose from 'mongoose';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { runCreateAccountTest } from './tests/api/create-account.test';
import { runLoginTest } from './tests/api/login.test';
import { runGetTasksTest } from './tests/api/get-tasks.test';
import {runSetupDiscordConfigTest} from "./tests/create-config";
import {runCreateTasksTest} from "./tests/api/create-tasks.test";
import {runDeleteTaskTest} from "./tests/api/delete-task.test";
import {runRefreshTokenTest} from "./tests/api/refresh-token.test";
import {runCompleteTaskTest} from "./tests/api/complete-task.test";
import {runUpdateUserConfigTest} from "./tests/api/update-user-config.test";

config({ path: resolve(__dirname, '../.env') });

export interface TestContext {
    baseUrl: string;
    userId?: string;
    authToken?: string;
    refreshToken?: string;
    taskIds?: string[];
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
    { name: 'refresh token', run: runRefreshTokenTest },
    { name: 'update user config', run: runUpdateUserConfigTest },
    { name: 'create tasks', run: runCreateTasksTest },
    { name: 'delete task', run: runDeleteTaskTest },
    { name: 'complete task', run: runCompleteTaskTest },
    { name: 'get tasks', run: runGetTasksTest }
];

async function runTests() {
    const totalTests = tests.length;
    console.log('\ninitializing test environment');

    const context: TestContext = {
        baseUrl: 'https://mac.timothyw.dev',
        account: {
            name: 'Test',
            email: 'test@test.com',
            password: 'test'
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
        console.log(`${chalk.green('all tests completed successfully')} ${chalk.magenta(`(${totalTests} total)`)}`)
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