import { CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Command from "../objects/command";
import UserManager from "../../server/controllers/user-manager";
import TaskListManager from "../controllers/task-list-manager";

export default class SetupCommand extends Command {
    constructor() {
        super('setup', 'Setup automated task list updates');
        this.data
            .addStringOption(option =>
                option
                    .setName('type')
                    .setDescription('What to set up')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Task List', value: 'list' }
                    )
            );
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        const options = interaction.options as CommandInteractionOptionResolver;
        const type = options.getString('type', true);

        if (type !== 'list') {
            await interaction.reply({
                content: 'Invalid setup type specified',
                ephemeral: true
            });
            return;
        }

        const user = await UserManager.getInstance().getByDiscordID(interaction.user.id);
        if (!user) {
            await interaction.reply({
                content: 'You need to set up your user profile first',
                ephemeral: true
            });
            return;
        }

        const isTracking = TaskListManager.getInstance().isTracking(interaction.user.id);
        const success = await TaskListManager.getInstance().startTracking(
            interaction.channelId,
            interaction.user.id
        );

        await interaction.reply({
            content: success
                ? `Task list tracking has been ${isTracking ? 'moved to' : 'set up in'} this channel. It will update every 10 seconds.`
                : 'Failed to set up task list tracking. Please try again later.',
            ephemeral: true
        });
    }
}