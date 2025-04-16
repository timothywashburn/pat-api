import { CommandInteraction, CommandInteractionOptionResolver, AutocompleteInteraction } from 'discord.js';
import Command from "../../models/command";
import ConfigManager from "../../../controllers/config-manager";

const ADMIN_DISCORD_ID = '458458767634464792';

export default class RemoveEmailCommand extends Command {
    constructor() {
        super('remove-email', 'Remove an email from the authorized developers list');
        this.data
            .addStringOption(option =>
                option
                    .setName('email')
                    .setDescription('The email address to remove')
                    .setRequired(true)
                    .setAutocomplete(true)
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

        try {
            const config = ConfigManager.getConfig();
            const authorizedEmails = config.dev?.authorizedEmails || [];

            if (!authorizedEmails.includes(email)) {
                await interaction.reply({
                    content: `${email} is not in the authorized developer emails list`,
                    ephemeral: true
                });
                return;
            }

            const updatedEmails = authorizedEmails.filter(e => e !== email);

            const configManager = new ConfigManager();
            const updated = await configManager.update({
                dev: {
                    authorizedEmails: updatedEmails
                }
            });

            if (!updated) {
                await interaction.reply({
                    content: 'Failed to remove the authorized email',
                    ephemeral: true
                });
                return;
            }

            await interaction.reply({
                content: `Successfully removed ${email} from authorized developer emails`,
                ephemeral: true
            });

        } catch (error) {
            console.error('error in remove-authorized-email command:', error);
            await interaction.reply({
                content: 'An error occurred while removing the authorized email',
                ephemeral: true
            });
        }
    }

    async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        try {
            // @ts-ignore
            const focusedValue = interaction.options.getFocused().toLowerCase();
            const config = ConfigManager.getConfig();
            const authorizedEmails = config.dev?.authorizedEmails || [];

            const filtered = authorizedEmails.filter(email => email.toLowerCase().startsWith(focusedValue));

            await interaction.respond(
                filtered.slice(0, 25).map(email => ({
                    name: email,
                    value: email
                }))
            );
        } catch (error) {
            console.error('error in remove-authorized-email autocomplete:', error);
            await interaction.respond([]);
        }
    }
}