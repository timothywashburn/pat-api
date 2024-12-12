import ItemManager from "../../controllers/item-manager";
import Command from "../models/command";
import {AutocompleteInteraction, CommandInteraction, CommandInteractionOptionResolver} from "discord.js";
import UserManager from "../../controllers/user-manager";

export default class DeleteItemCommand extends Command {
    constructor() {
        super('delete', 'Delete a item');
        this.data
            .addStringOption(option =>
                option
                    .setName('name')
                    .setDescription('The name of the item to delete')
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
        const itemToDelete = items.find(item => item.name.toLowerCase() === itemName.toLowerCase());

        if (!itemToDelete) {
            await interaction.reply({ content: 'Item not found', ephemeral: true });
            return;
        }

        await ItemManager.getInstance().delete(itemToDelete._id);
        await interaction.reply(`Item "${itemName}" deleted successfully`);
    }
}