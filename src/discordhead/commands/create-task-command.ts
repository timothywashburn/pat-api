import { CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Command from "../models/command";
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

    private parseDueDate(dateStr: string, timezone: string): Date | null {
        dateStr = dateStr.trim();

        const dateRegex = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}))?$/;
        const match = dateStr.match(dateRegex);

        if (!match) {
            return null;
        }

        const month = parseInt(match[1], 10) - 1;
        const day = parseInt(match[2], 10);
        const currentDate = new Date();

        let year = currentDate.getFullYear();
        if (match[3]) {
            year = 2000 + parseInt(match[3], 10);
        }

        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T23:59:59`;
        const targetDate = new Date(targetDateStr);

        const userDate = new Date(formatter.format(currentDate));
        const targetDateInTz = new Date(formatter.format(targetDate));

        if (!match[3] && targetDateInTz < userDate) {
            targetDate.setFullYear(year + 1);
        }

        const finalDate = new Date(targetDate.toLocaleString('en-US', { timeZone: timezone }));

        finalDate.setHours(23, 59, 59, 999);

        return finalDate;
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
            const parsedDate = this.parseDueDate(dueString, user.timezone || 'UTC');
            if (!parsedDate) {
                await interaction.reply({
                    content: 'Invalid date format. Please use MM/DD or MM/DD/YY',
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
                dueDate
                    ? ` (due: <t:${Math.floor(dueDate.getTime() / 1000)}:f>)`
                    : ''
            }`
        );
    }
}