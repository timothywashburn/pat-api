import { CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Command from "../objects/command";
import TaskManager from "../../server/controllers/task-manager";
import UserManager from "../../server/controllers/user-manager";

export default class CreateTaskCommand extends Command {
    constructor() {
        super('create', 'Create a new task');
        this.data
            .addStringOption(option =>
                option
                    .setName('name')
                    .setDescription('The name of the task')
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
                    .setDescription('Additional notes for the task')
                    .setRequired(false)
            );
    }

    private parseDueDate(dateStr: string): Date | null {
        dateStr = dateStr.trim();

        const dateRegex = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}))?$/;
        const match = dateStr.match(dateRegex);

        if (!match) {
            return null;
        }

        const month = parseInt(match[1], 10);
        const day = parseInt(match[2], 10);
        const currentYear = new Date().getFullYear();

        let year = currentYear;
        if (match[3]) {
            year = 2000 + parseInt(match[3], 10);
        }

        if (month < 1 || month > 12 || day < 1 || day > 31 || year < currentYear || year > currentYear + 10) {
            return null;
        }

        const dueDate = new Date(year, month - 1, day);

        if (!match[3] && dueDate < new Date()) {
            dueDate.setFullYear(currentYear + 1);
        }

        if (dueDate.getMonth() !== month - 1 || dueDate.getDate() !== day) {
            return null;
        }

        return dueDate;
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

        const existingTasks = await TaskManager.getInstance().getAllByUser(user._id);
        if (existingTasks.some(task => task.name.toLowerCase() === name.toLowerCase())) {
            await interaction.reply({ content: 'A task with this name already exists', ephemeral: true });
            return;
        }

        let dueDate: Date | undefined;
        if (dueString) {
            const parsedDate = this.parseDueDate(dueString);
            if (!parsedDate) {
                await interaction.reply({
                    content: 'Invalid date format. Please use MM/DD or MM/DD/YY (e.g., 1/5, 01/05, 12/25, 1/5/24)',
                    ephemeral: true
                });
                return;
            }
            dueDate = parsedDate;
        }

        const task = await TaskManager.getInstance().create(user._id, {
            name,
            dueDate,
            notes
        });

        await interaction.reply(
            `Task "${task.name}" created successfully${
                dueDate ? ` (due: ${dueDate.toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: '2-digit'
                })})` : ''
            }`
        );
    }
}