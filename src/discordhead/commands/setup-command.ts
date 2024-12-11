import { CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Command from "../models/command";
import UserManager from "../../server/controllers/user-manager";
import ItemListManager from "../controllers/item-list-manager";
import ConfigManager from "../../server/controllers/config-manager";
import DiscordLogger from "../controllers/discord-logger";

export default class SetupCommand extends Command {
    constructor() {
        super('setup', 'Setup automated item list updates and logging');
        this.data
            .addStringOption(option =>
                option
                    .setName('type')
                    .setDescription('What to set up')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Item List', value: 'list' },
                        { name: 'Log Channel', value: 'logs' }
                    )
            );
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        const options = interaction.options as CommandInteractionOptionResolver;
        const type = options.getString('type', true);

        if (type === 'logs') {
            if (!interaction.memberPermissions?.has('Administrator')) {
                await interaction.reply({
                    content: 'You need administrator permissions to set up logging',
                    ephemeral: true
                });
                return;
            }

            const configManager = new ConfigManager();
            await configManager.update({
                discord: {
                    ...ConfigManager.getConfig().discord,
                    logChannelId: interaction.channelId
                }
            });

            await DiscordLogger.getInstance().updateLogChannel();

            await interaction.reply({
                content: 'Log channel has been set up in this channel. System logs will now be streamed here.',
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

        const isTracking = ItemListManager.getInstance().isTracking(user._id.toString());
        const success = await ItemListManager.getInstance().startTracking(
            interaction.channelId,
            user._id.toString(),
            interaction.user.id
        );

        await interaction.reply({
            content: success
                ? `Item list tracking has been ${isTracking ? 'moved to' : 'set up in'} this channel. It will update every 10 seconds.`
                : 'Failed to set up item list tracking. Please try again later.',
            ephemeral: true
        });
    }
}