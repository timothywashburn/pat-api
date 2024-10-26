import { CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Command from "../objects/command";
import TaskManager from "../../server/controllers/task-manager";
import UserManager from "../../server/controllers/user-manager";
import {TaskData} from "../../server/objects/task";

interface TaskCategories {
    overdue: TaskData[];
    upcoming: TaskData[];
    undated: TaskData[];
}

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
            );
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        const options = interaction.options as CommandInteractionOptionResolver;
        const limit = options.getInteger('limit') ?? 10;
        const user = await UserManager.getInstance().getByDiscordID(Number(interaction.user.id));

        if (!user) {
            await interaction.reply({ content: 'You need to set up your user profile first', ephemeral: true });
            return;
        }

        const tasks = await TaskManager.getInstance().getAllByUser(user._id);
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

        (Object.keys(categorizedTasks) as Array<keyof TaskCategories>).forEach(category => {
            categorizedTasks[category] = categorizedTasks[category].slice(0, limit);
        });

        const sections = [];

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

        if (sections.length === 0) {
            await interaction.reply('You have no pending tasks');
            return;
        }

        await interaction.reply(sections.join('\n\n'));
    }
}