import { CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Command from "../models/command";
import ItemManager from "../../controllers/item-manager";
import UserManager from "../../controllers/user-manager";

export default class CreateItemCommand extends Command {
    constructor() {
        super('create', 'Create a new item');
        this.data
            .addStringOption(option =>
                option
                    .setName('name')
                    .setDescription('The name of the item')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('due')
                    .setDescription('Due date (format: MM/DD or MM/DD/YY)')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option
                    .setName('notes')
                    .setDescription('Additional notes for the item')
                    .setRequired(false)
            );
    }

    private parseDueDate(dateStr: string, timezone: string): Date | null {
        dateStr = dateStr.trim();
        const dateRegex = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}))?$/;
        const match = dateStr.match(dateRegex);

        if (!match) return null;

        const month = parseInt(match[1], 10) - 1;
        const day = parseInt(match[2], 10);
        let year = new Date().getFullYear();

        if (match[3]) {
            year = 2000 + parseInt(match[3], 10);
        }

        const targetDate = new Date();
        targetDate.toLocaleString('en-US', { timeZone: timezone });
        targetDate.setFullYear(year, month, day);
        targetDate.setHours(23, 59, 59, 999);

        const now = new Date();
        if (!match[3] && targetDate < now) {
            targetDate.setFullYear(year + 1);
        }

        return targetDate;
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        const options = interaction.options as CommandInteractionOptionResolver;
        const name = options.getString('name', true);
        const dueString = options.getString('due');
        const notes = options.getString('notes') ?? undefined;

        const user = await UserManager.getInstance().getByDiscordID(interaction.user.id);
        if (!user) {
            await interaction.reply({ content: 'You need to set up your user profile first', ephemeral: true });
            return;
        }

        const existingItems = await ItemManager.getInstance().getAllByUser(user._id);
        if (existingItems.some(item => item.name.toLowerCase() === name.toLowerCase())) {
            await interaction.reply({ content: 'A item with this name already exists', ephemeral: true });
            return;
        }

        let dueDate: Date | undefined;
        if (dueString) {
            const parsedDate = this.parseDueDate(dueString, user.timezone);
            if (!parsedDate) {
                await interaction.reply({
                    content: 'Invalid date format. Please use MM/DD or MM/DD/YY',
                    ephemeral: true
                });
                return;
            }
            dueDate = parsedDate;
        }

        const item = await ItemManager.getInstance().create(user._id, {
            name,
            dueDate,
            notes
        });

        await interaction.reply(
            `Item "${item.name}" created successfully${
                dueDate
                    ? ` (due: <t:${Math.floor(dueDate.getTime() / 1000)}:f>)`
                    : ''
            }`
        );
    }
}