import { CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Command from "../../models/command";
import ConfigManager from "../../../controllers/config-manager";

const ADMIN_DISCORD_ID = '458458767634464792';

export default class AddEmailCommand extends Command {
    constructor() {
        super('add-email', 'Add an email to the authorized developers list');
        this.data.addStringOption(option =>
                option
                    .setName('email')
                    .setDescription('The email address to authorize')
                    .setRequired(true)
            );
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        if (interaction.user.id !== ADMIN_DISCORD_ID) {
            await interaction.reply({
                content: 'You do not have permission to use this command',
                ephemeral: true
            });
            return;
        }

        const options = interaction.options as CommandInteractionOptionResolver;
        // @ts-ignore
        const email = options.getString('email', true).toLowerCase().trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            await interaction.reply({
                content: 'Please provide a valid email address',
                ephemeral: true
            });
            return;
        }

        try {
            const config = ConfigManager.getConfig();
            const authorizedEmails = config.dev?.authorizedEmails || [];

            if (authorizedEmails.includes(email)) {
                await interaction.reply({
                    content: `${email} is already an authorized developer email`,
                    ephemeral: true
                });
                return;
            }

            const updatedEmails = [...authorizedEmails, email];

            const configManager = new ConfigManager();
            const updated = await configManager.update({
                dev: {
                    authorizedEmails: updatedEmails
                }
            });

            if (!updated) {
                await interaction.reply({
                    content: 'Failed to add the authorized email',
                    ephemeral: true
                });
                return;
            }

            await interaction.reply({
                content: `Successfully added ${email} to authorized developer emails`,
                ephemeral: true
            });

        } catch (error) {
            console.error('error in add-authorized-email command:', error);
            await interaction.reply({
                content: 'An error occurred while adding the authorized email',
                ephemeral: true
            });
        }
    }
}