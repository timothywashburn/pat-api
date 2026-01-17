import { CommandInteraction } from "discord.js";
import Command from "../../models/command";
import ConfigManager from "../../../controllers/config-manager";

const ADMIN_DISCORD_ID = '458458767634464792';

export default class ListEmailsCommand extends Command {
    constructor() {
        super('list-emails', 'List all emails authorized for developer access');
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        if (interaction.user.id !== ADMIN_DISCORD_ID) {
            await interaction.reply({
                content: 'You do not have permission to use this command',
                ephemeral: true
            });
            return;
        }

        try {
            const config = ConfigManager.getConfig();
            const authorizedEmails = config.dev?.authorizedEmails || [];

            if (authorizedEmails.length === 0) {
                await interaction.reply({
                    content: 'No authorized emails found',
                    ephemeral: true
                });
                return;
            }

            const emailList = authorizedEmails.map(email => `• ${email}`).join('\n');

            await interaction.reply({
                content: `**Authorized Developer Emails:**\n${emailList}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('error in authorized-emails command:', error);
            await interaction.reply({
                content: 'An error occurred while fetching authorized emails',
                ephemeral: true
            });
        }
    }
}