import { CommandInteraction, CommandInteractionOptionResolver, AutocompleteInteraction } from 'discord.js';
import Command from "../models/command";
import UserManager from "../../server/controllers/user-manager";

export default class SetTimezoneCommand extends Command {
    private static readonly COMMON_TIMEZONES = [
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Phoenix',
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Australia/Sydney',
        'Pacific/Auckland'
    ];

    constructor() {
        super('timezone', 'Set your timezone for due dates and times');
        this.data
            .addStringOption(option =>
                option
                    .setName('zone')
                    .setDescription('Your timezone (e.g., America/New_York)')
                    .setRequired(true)
                    .setAutocomplete(true)
            );
    }

    async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const focusedValue = interaction.options.getFocused().toLowerCase();

        const filtered = SetTimezoneCommand.COMMON_TIMEZONES
            .filter(zone => zone.toLowerCase().includes(focusedValue))
            .map(zone => ({
                name: zone.replace('_', ' '),
                value: zone
            }));

        await interaction.respond(filtered);
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        const options = interaction.options as CommandInteractionOptionResolver;
        const timezone = options.getString('zone', true);

        const user = await UserManager.getInstance().getByDiscordID(interaction.user.id);
        if (!user) {
            await interaction.reply({
                content: 'You need to set up your user profile first',
                ephemeral: true
            });
            return;
        }

        try {
            Intl.DateTimeFormat(undefined, { timeZone: timezone });

            const updated = await UserManager.getInstance().update(interaction.user.id, {
                timezone
            });

            if (!updated) {
                await interaction.reply({
                    content: 'Failed to update timezone',
                    ephemeral: true
                });
                return;
            }

            const now = new Date();
            const timeInZone = now.toLocaleTimeString('en-US', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit'
            });

            await interaction.reply({
                content: `Your timezone has been set to ${timezone}. Your current time should be ${timeInZone}.`,
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                content: 'Invalid timezone specified. Please use a valid IANA timezone name (e.g., America/New_York)',
                ephemeral: true
            });
        }
    }
}