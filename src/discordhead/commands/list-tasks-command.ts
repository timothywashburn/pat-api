import { CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Command from "../models/command";
import TaskManager from "../../server/controllers/task-manager";
import UserManager from "../../server/controllers/user-manager";
import {TaskData} from "../../server/models/task";
import TaskListManager from "../controllers/task-list-manager";

export default class ListTasksCommand extends Command {
    constructor() {
        super('list', 'List your tasks');
        this.data
            .addIntegerOption(option =>
                option
                    .setName('limit')
                    .setDescription('Number of tasks to show per category (default: 10)')
                    .setRequired(false)
                    .setMinValue(1)
                    .setMaxValue(25)
            )
            .addBooleanOption(option =>
                option
                    .setName('completed')
                    .setDescription('Show completed tasks instead of pending tasks')
                    .setRequired(false)
            );
    }

    private formatCompletedTasks(tasks: TaskData[], limit: number): string {
        const sortedTasks = [...tasks]
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, limit);

        if (sortedTasks.length === 0) {
            return 'No completed tasks found';
        }

        const taskList = sortedTasks
            .map((task, index) => {
                const completedTimestamp = Math.floor(task.updatedAt.getTime() / 1000);
                let taskString = `${index + 1}. ${task.name} (completed <t:${completedTimestamp}:R>)`;

                if (task.dueDate) {
                    const wasOverdue = task.dueDate < task.updatedAt;
                    taskString += wasOverdue ? ' ⏰' : ' ✅';
                }

                return taskString;
            })
            .join('\n');

        return `**Recently Completed Tasks:**\n${taskList}`;
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        const options = interaction.options as CommandInteractionOptionResolver;
        const limit = options.getInteger('limit') ?? 10;
        const showCompleted = options.getBoolean('completed') ?? false;
        const user = await UserManager.getInstance().getByDiscordID(interaction.user.id);

        if (!user) {
            await interaction.reply({ content: 'You need to set up your user profile first', ephemeral: true });
            return;
        }

        const tasks = await TaskManager.getInstance().getAllByUser(user._id);

        if (showCompleted) {
            const completedTasks = tasks.filter(task => task.completed);
            await interaction.reply(this.formatCompletedTasks(completedTasks, limit));
            return;
        }

        const formattedList = TaskListManager.formatTaskList(tasks, user, false);
        await interaction.reply(formattedList);
    }
}