import { Client, Message, TextChannel } from 'discord.js';
import { TaskData } from "../../server/models/mongo/task";
import UserManager from "../../server/controllers/user-manager";
import TaskManager from "../../server/controllers/task-manager";
import { UserConfig } from "../../server/models/mongo/user-config";
import { Types } from 'mongoose';

interface TaskCategories {
    overdue: TaskData[];
    upcoming: TaskData[];
    undated: TaskData[];
}

interface Tracker {
    channelId: string;
    messageId: string;
    interval: NodeJS.Timeout;
    discordId: string;  // Keep Discord ID for Discord-specific operations
}

export default class TaskListManager {
    private static instance: TaskListManager;
    private activeTrackers: Map<string, Tracker> = new Map();  // Key is userId string
    private client: Client | null = null;

    static getInstance(): TaskListManager {
        if (!TaskListManager.instance) {
            TaskListManager.instance = new TaskListManager();
        }
        return TaskListManager.instance;
    }

    setClient(client: Client) {
        this.client = client;
    }

    async initializeTrackers() {
        if (!this.client) throw new Error('Client not set');

        const users = await UserManager.getInstance().getAllWithTracking();

        for (const user of users) {
            if (!user.taskListTracking || !user.discordID) continue;

            try {
                const channel = await this.client.channels.fetch(user.taskListTracking.channelId);
                if (!(channel instanceof TextChannel)) continue;

                const message = await channel.messages.fetch(user.taskListTracking.messageId).catch(() => null);
                if (!message) {
                    await UserManager.getInstance().update(user._id, { taskListTracking: undefined });
                    continue;
                }

                await this.startTracking(user.taskListTracking.channelId, user._id.toString(), user.discordID, message);
            } catch (error) {
                console.error('Error initializing tracker:', error);
                await UserManager.getInstance().update(user._id, { taskListTracking: undefined });
            }
        }
    }

    static formatTaskList(tasks: TaskData[], user: UserConfig, autoUpdate: boolean = false): string {
        const now = new Date();

        const categorizedTasks = tasks
            .filter(task => !task.completed)
            .reduce<TaskCategories>((acc, task) => {
                if (!task.dueDate) {
                    acc.undated.push(task);
                } else if (task.dueDate < now) {
                    acc.overdue.push(task);
                } else {
                    acc.upcoming.push(task);
                }
                return acc;
            }, {
                overdue: [],
                upcoming: [],
                undated: []
            });

        categorizedTasks.overdue.sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());
        categorizedTasks.upcoming.sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());
        categorizedTasks.undated.sort((a, b) => a.name.localeCompare(b.name));

        const sections = [`# Task List for ${user.name}`];

        if (categorizedTasks.overdue.length > 0) {
            const overdueTasks = categorizedTasks.overdue
                .map((task, index) => {
                    const timestamp = Math.floor(task.dueDate!.getTime() / 1000);
                    return `${index + 1}. ${task.name} (<t:${timestamp}:R>)`;
                })
                .join('\n');
            sections.push(`**Overdue:**\n${overdueTasks}`);
        }

        if (categorizedTasks.upcoming.length > 0) {
            const upcomingTasks = categorizedTasks.upcoming
                .map((task, index) => {
                    const timestamp = Math.floor(task.dueDate!.getTime() / 1000);
                    return `${index + 1}. ${task.name} (<t:${timestamp}:R>)`;
                })
                .join('\n');
            sections.push(`**Upcoming:**\n${upcomingTasks}`);
        }

        if (categorizedTasks.undated.length > 0) {
            const undatedTasks = categorizedTasks.undated
                .map((task, index) => `${index + 1}. ${task.name}`)
                .join('\n');
            sections.push(`**Undated:**\n${undatedTasks}`);
        }

        if (sections.length === 1) sections.push('No pending tasks');

        if (autoUpdate) sections.push(`*Last updated: <t:${Math.floor(Date.now() / 1000)}:R>*`);

        return sections.join('\n\n');
    }

    async refreshList(userId: string, message: Message): Promise<void> {
        try {
            const channel = await this.client!.channels.fetch(message.channelId).catch(() => null);
            if (!channel || !(channel instanceof TextChannel)) {
                this.stopTracking(userId);
                return;
            }

            const messageCheck = await channel.messages.fetch(message.id).catch(() => null);
            if (!messageCheck) {
                this.stopTracking(userId);
                return;
            }

            const user = await UserManager.getInstance().getById(new Types.ObjectId(userId));
            if (!user) {
                this.stopTracking(userId);
                return;
            }

            const updatedTasks = await TaskManager.getInstance().getAllByUser(user._id);
            const updatedList = TaskListManager.formatTaskList(updatedTasks, user, true);
            await message.edit(updatedList);
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'code' in error) {
                if (error.code === 10008 || error.code === 10003) {
                    this.stopTracking(userId);
                    return;
                }
            }
            console.error('Error updating task list:', error);
        }
    }

    async startTracking(
        channelId: string,
        userId: string,
        discordId: string,
        existingMessage?: Message
    ): Promise<boolean> {
        this.stopTracking(userId);

        if (!this.client) throw new Error('Client not set');

        const channel = await this.client.channels.fetch(channelId).catch(() => null);
        if (!channel || !(channel instanceof TextChannel)) return false;

        const user = await UserManager.getInstance().getById(new Types.ObjectId(userId));
        if (!user) return false;

        try {
            let message: Message;
            if (existingMessage) {
                const messageCheck = await channel.messages.fetch(existingMessage.id).catch(() => null);
                if (!messageCheck) return false;
                message = messageCheck;
            } else {
                const tasks = await TaskManager.getInstance().getAllByUser(user._id);
                const formattedList = TaskListManager.formatTaskList(tasks, user, true);
                message = await channel.send(formattedList);
            }

            const boundRefreshList = () => this.refreshList(userId, message);
            await boundRefreshList();
            const interval = setInterval(boundRefreshList, 10000);

            this.activeTrackers.set(userId, {
                channelId,
                messageId: message.id,
                interval,
                discordId
            });

            if (!existingMessage) {
                await UserManager.getInstance().update(user._id, {
                    taskListTracking: {
                        channelId,
                        messageId: message.id
                    }
                });
            }

            return true;
        } catch (error) {
            console.error('Error starting task tracking:', error);
            return false;
        }
    }

    stopTracking(userId: string): void {
        const tracker = this.activeTrackers.get(userId);
        if (tracker) {
            clearInterval(tracker.interval);
            this.activeTrackers.delete(userId);

            UserManager.getInstance()
                .update(new Types.ObjectId(userId), { taskListTracking: undefined })
                .catch(console.error);
        }
    }

    isTracking(userId: string): boolean {
        return this.activeTrackers.has(userId);
    }
}