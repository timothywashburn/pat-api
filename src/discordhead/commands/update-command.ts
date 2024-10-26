import { CommandInteraction } from 'discord.js';
import Command from "../objects/command";
import { execSync } from 'child_process';
import path from 'path';

const ADMIN_DISCORD_ID = '458458767634464792';

export default class UpdateCommand extends Command {
    constructor() {
        super('update', 'Update the bot to the latest version');
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        if (interaction.user.id !== ADMIN_DISCORD_ID) {
            await interaction.reply({
                content: 'You do not have permission to use this command',
                ephemeral: true
            });
            return;
        }

        await interaction.reply('Starting update process...');

        try {
            const scriptPath = path.resolve(__dirname, '../../../scripts/update.sh');
            execSync(`bash ${scriptPath}`, { stdio: 'inherit' });

            await interaction.editReply('Update completed! The bot will restart momentarily.');

            setTimeout(() => process.exit(0), 1000);
        } catch (error) {
            console.error('Update failed:', error);
            await interaction.editReply('❌ Update failed. Check the logs for more information.');
        }
    }
}