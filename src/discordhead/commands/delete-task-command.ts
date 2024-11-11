import { AutocompleteFocusedOption, AutocompleteInteraction, CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Command from "../models/command";
import TaskManager from "../../server/controllers/task-manager";
import UserManager from "../../server/controllers/user-manager";

export default class DeleteTaskCommand extends Command {
    constructor() {
        super('delete', 'Delete a task');
        this.data
            .addStringOption(option =>
                option
                    .setName('name')
                    .setDescription('The name of the task to delete')
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
        const taskToDelete = tasks.find(task => task.name.toLowerCase() === taskName.toLowerCase());

        if (!taskToDelete) {
            await interaction.reply({ content: 'Task not found', ephemeral: true });
            return;
        }

        await TaskManager.getInstance().delete(taskToDelete._id);
        await interaction.reply(`Task "${taskName}" deleted successfully`);
    }
}