import { AutocompleteInteraction, CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Command from "../models/command";
import ItemManager from "../../controllers/item-manager";
import UserManager from "../../controllers/user-manager";

export default class CompleteItemCommand extends Command {
    constructor() {
        super('complete', 'Mark a item as completed');
        this.data
            .addStringOption(option =>
                option
                    .setName('name')
                    .setDescription('The name of the item to mark as completed')
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

        const items = await ItemManager.getInstance().getAllByUser(user._id);
        const filtered = items
            .filter(item =>
                !item.completed &&
                item.name.toLowerCase().includes(focusedOption.value.toLowerCase())
            )
            .slice(0, 25)
            .map(item => ({
                name: item.name,
                value: item.name
            }));

        await interaction.respond(filtered);
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        const options = interaction.options as CommandInteractionOptionResolver;
        const itemName = options.getString('name', true);
        const user = await UserManager.getInstance().getByDiscordID(interaction.user.id);

        if (!user) {
            await interaction.reply({ content: 'You need to set up your user profile first', ephemeral: true });
            return;
        }

        const items = await ItemManager.getInstance().getAllByUser(user._id);
        const itemToComplete = items.find(item =>
            item.name.toLowerCase() === itemName.toLowerCase() && !item.completed
        );

        if (!itemToComplete) {
            await interaction.reply({
                content: 'Item not found or already completed',
                ephemeral: true
            });
            return;
        }

        const updatedItem = await ItemManager.getInstance().setCompleted(itemToComplete._id, true);

        if (!updatedItem) {
            await interaction.reply({
                content: 'An error occurred while completing the item',
                ephemeral: true
            });
            return;
        }

        await interaction.reply(
            `✅ Item "${itemName}" marked as complete${
                itemToComplete.dueDate
                    ? itemToComplete.dueDate < new Date()
                        ? ' (completed overdue)'
                        : ' (completed on time)'
                    : ''
            }`
        );
    }
}