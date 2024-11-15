import { AutocompleteInteraction, CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Command from "../models/command";
import TaskManager from "../../server/controllers/task-manager";
import UserManager from "../../server/controllers/user-manager";

export default class CompleteTaskCommand extends Command {
    constructor() {
        super('complete', 'Mark a task as completed');
        this.data
            .addStringOption(option =>
                option
                    .setName('name')
                    .setDescription('The name of the task to mark as completed')
                    .setRequired(true)
                    .setAutocomplete(true)
            );
    }

    async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const focusedOption = interaction.options.getFocused(true);
        const user = await UserManager.getInstance().getByDiscordID(interaction.user.id);

        if (!user) {
            await interaction.respond([]);
            return;
        }

        const tasks = await TaskManager.getInstance().getAllByUser(user._id);
        const filtered = tasks
            .filter(task =>
                !task.completed &&
                task.name.toLowerCase().includes(focusedOption.value.toLowerCase())
            )
            .slice(0, 25)
            .map(task => ({
                name: task.name,
                value: task.name
            }));

        await interaction.respond(filtered);
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        const options = interaction.options as CommandInteractionOptionResolver;
        const taskName = options.getString('name', true);
        const user = await UserManager.getInstance().getByDiscordID(interaction.user.id);

        if (!user) {
            await interaction.reply({ content: 'You need to set up your user profile first', ephemeral: true });
            return;
        }

        const tasks = await TaskManager.getInstance().getAllByUser(user._id);
        const taskToComplete = tasks.find(task =>
            task.name.toLowerCase() === taskName.toLowerCase() && !task.completed
        );

        if (!taskToComplete) {
            await interaction.reply({
                content: 'Task not found or already completed',
                ephemeral: true
            });
            return;
        }

        const updatedTask = await TaskManager.getInstance().toggleComplete(taskToComplete._id);

        if (!updatedTask) {
            await interaction.reply({
                content: 'An error occurred while completing the task',
                ephemeral: true
            });
            return;
        }

        await interaction.reply(
            `✅ Task "${taskName}" marked as complete${
                taskToComplete.dueDate
                    ? taskToComplete.dueDate < new Date()
                        ? ' (completed overdue)'
                        : ' (completed on time)'
                    : ''
            }`
        );
    }
}