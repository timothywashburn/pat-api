import mongoose from 'mongoose';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { runCreateAccountTest } from './unit/api/auth/create-account.test';
import { runSignInTest } from './unit/api/auth/sign-in.test';
import { runGetItemsTest } from './unit/api/items/get-items.test';
import { runCreateConfigTest } from "./unit/create-config";
import { runCreateItemsTest } from "./unit/api/items/create-items.test";
import { runDeleteItemTest } from "./unit/api/items/delete-item.test";
import { runRefreshTokenTest } from "./unit/api/auth/refresh-auth.test";
import { runCompleteItemTest } from "./unit/api/items/complete-item.test";
import { runUpdateUserConfigTest } from "./unit/api/account/update-user.test";
import { runGetUserConfigTest } from "./unit/api/account/get-user.test";
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
import { ItemId, PersonId, ThoughtId, UserId } from "@timothyw/pat-common";
import { TaskId, TaskListId } from "@timothyw/pat-common";
import { runCreateTaskListsTest } from "./unit/api/tasks/create-task-lists.test";
import { runCreateTasksTest } from "./unit/api/tasks/create-tasks.test";
import { runGetTaskListsTest } from "./unit/api/tasks/get-task-lists.test";
import { runGetTasksTest } from "./unit/api/tasks/get-tasks.test";
import { runCompleteTaskTest } from "./unit/api/tasks/complete-task.test";
import { runUpdateTaskTest } from "./unit/api/tasks/update-task.test";
import { runUpdateTaskListTest } from "./unit/api/tasks/update-task-list.test";
import { runDeleteTaskTest } from "./unit/api/tasks/delete-task.test";
import { runDeleteTaskListTest } from "./unit/api/tasks/delete-task-list.test";
import { runCreateHabitsTest } from "./unit/api/habits/create-habits.test";
import { runGetHabitsTest } from "./unit/api/habits/get-habits.test";
import { runUpdateHabitTest } from "./unit/api/habits/update-habit.test";
import { runCreateHabitEntriesTest } from "./unit/api/habits/create-habit-entries.test";
import { runDeleteHabitEntryTest } from "./unit/api/habits/delete-habit-entry.test";
import { runDeleteHabitTest } from "./unit/api/habits/delete-habit.test";
import { runVersionTest } from "./unit/api/misc/version.test";

config({ path: resolve(__dirname, '../../.env') });

export interface TestContext {
    baseUrl: string;
    skipVerificationEmail: boolean;

    userId?: UserId;
    authToken?: string;
    refreshToken?: string;
    emailVerificationToken?: string;
    itemIds: ItemId[];
    thoughtIds: ThoughtId[];
    personIds: PersonId[];
    taskIds: TaskId[];
    taskListIds: TaskListId[];
    habitIds: string[];
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
    { name: 'create config', run: runCreateConfigTest },

    { name: 'check version', run: runVersionTest },

    { name: 'create account', run: runCreateAccountTest },
    { name: 'sign in', run: runSignInTest },
    // { name: 'resend verification', run: runResendVerificationTest },
    { name: 'verify email', run: runVerifyEmailTest },
    { name: 'refresh token', run: runRefreshTokenTest },

    { name: 'get user', run: runGetUserConfigTest },
    { name: 'update user', run: runUpdateUserConfigTest },

    { name: 'create items', run: runCreateItemsTest },
    { name: 'delete item', run: runDeleteItemTest },
    { name: 'complete & uncomplete item', run: runCompleteItemTest },
    { name: 'update item', run: runUpdateItemTest },
    { name: 'get items', run: runGetItemsTest },

    { name: 'create thoughts', run: runCreateThoughtsTest },
    { name: 'delete thought', run: runDeleteThoughtTest },
    { name: 'update thought', run: runUpdateThoughtTest },
    { name: 'get thoughts', run: runGetThoughtsTest },

    { name: 'create people', run: runCreatePeopleTest },
    { name: 'delete person', run: runDeletePersonTest },
    { name: 'update person', run: runUpdatePersonTest },
    { name: 'get people', run: runGetPeopleTest },

    { name: 'create task lists', run: runCreateTaskListsTest },
    { name: 'create tasks', run: runCreateTasksTest },
    { name: 'get task lists', run: runGetTaskListsTest },
    { name: 'get tasks', run: runGetTasksTest },
    { name: 'complete task', run: runCompleteTaskTest },
    { name: 'update task', run: runUpdateTaskTest },
    { name: 'update task list', run: runUpdateTaskListTest },
    { name: 'delete task', run: runDeleteTaskTest },
    { name: 'delete task list', run: runDeleteTaskListTest },

    { name: 'create habits', run: runCreateHabitsTest },
    { name: 'get habits', run: runGetHabitsTest },
    { name: 'update habit', run: runUpdateHabitTest },
    { name: 'create habit entries', run: runCreateHabitEntriesTest },
    { name: 'delete habit entry', run: runDeleteHabitEntryTest },
    { name: 'delete habit', run: runDeleteHabitTest }
];

async function runTests() {
    const totalTests = tests.length;
    console.log('\ninitializing test environment');

    const context: TestContext = {
        baseUrl: 'https://mac.timothyw.dev',
        skipVerificationEmail: true,
        itemIds: [],
        thoughtIds: [],
        personIds: [],
        taskIds: [],
        taskListIds: [],
        habitIds: [],
        account: {
            name: 'Before Updating Name',
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
                console.log(chalk.red(`  ► ${test.name} ${chalk.magenta(`(${i + 1}/${totalTests})`)}`));
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