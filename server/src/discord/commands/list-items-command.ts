import { CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Command from "../models/command";
import ItemManager from "../../controllers/item-manager";
import UserManager from "../../controllers/user-manager";
import {ItemData} from "../../models/mongo/item-data";
import ItemListManager from "../controllers/item-list-manager";

export default class ListItemsCommand extends Command {
    constructor() {
        super('list', 'List your items');
        this.data
            .addIntegerOption(option =>
                option
                    .setName('limit')
                    .setDescription('Number of items to show per category (default: 10)')
                    .setRequired(false)
                    .setMinValue(1)
                    .setMaxValue(25)
            )
            .addBooleanOption(option =>
                option
                    .setName('completed')
                    .setDescription('Show completed items instead of pending items')
                    .setRequired(false)
            );
    }

    private formatCompletedItems(items: ItemData[], limit: number): string {
        const sortedItems = [...items]
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, limit);

        if (sortedItems.length === 0) {
            return 'No completed items found';
        }

        const itemList = sortedItems
            .map((item, index) => {
                const completedTimestamp = Math.floor(item.updatedAt.getTime() / 1000);
                let itemString = `${index + 1}. ${item.name} (completed <t:${completedTimestamp}:R>)`;

                if (item.dueDate) {
                    const wasOverdue = item.dueDate < item.updatedAt;
                    itemString += wasOverdue ? ' ⏰' : ' ✅';
                }

                return itemString;
            })
            .join('\n');

        return `**Recently Completed Items:**\n${itemList}`;
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

        const items = await ItemManager.getInstance().getAllByUser(user._id);

        if (showCompleted) {
            const completedItems = items.filter(item => item.completed);
            await interaction.reply(this.formatCompletedItems(completedItems, limit));
            return;
        }

        const formattedList = ItemListManager.formatItemList(items, user, false);
        await interaction.reply(formattedList);
    }
}