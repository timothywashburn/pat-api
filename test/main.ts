import mongoose from 'mongoose';
import { config } from 'dotenv';
import { resolve } from 'path';
import { AuthDataModel } from '../src/server/models/auth-data';
import { TaskModel } from '../src/server/models/task';
import { runCreateAccountTest } from './tests/create-account.test';
import { runLoginTest } from './tests/login.test';
import { runGetTasksTest } from './tests/get-tasks.test';

config({ path: resolve(__dirname, '../.env') });

export interface TestContext {
    baseUrl: string;
    userId?: string;
    authToken?: string;
}

async function clearDatabase() {
    console.log('clearing database')
    await AuthDataModel.deleteMany({});
    await TaskModel.deleteMany({});
    console.log('database cleared')
}

async function runTests() {
    console.log('starting api tests')

    const context: TestContext = {
        baseUrl: 'https://mac.timothyw.dev'
    };

    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('connected to mongodb')

        await clearDatabase();

        await runCreateAccountTest(context);
        await runLoginTest(context);
        await runGetTasksTest(context);

        console.log('all tests completed successfully')
    } catch (error) {
        console.error('test suite failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

runTests().catch(console.error);