import {
    APIApplicationCommand,
    Client,
    REST,
    CommandInteraction,
    Interaction,
    GatewayIntentBits, AutocompleteInteraction
} from 'discord.js';
import { Routes } from 'discord-api-types/v10';
import Command from "./models/command";
import PingCommand from "./commands/ping";
import ConfigManager from "../controllers/config-manager";
import DiscordLogger from "./controllers/discord-logger";
import LinkAccountCommand from "./commands/link-account-command";
import ListEmailsCommand from "./commands/authedemails/list-emails-command";
import AddEmailCommand from "./commands/authedemails/add-email-command";
import RemoveEmailCommand from "./commands/authedemails/remove-email-command";

export default class Bot {
    private client: Client;
    private commands: Command[] = [];

    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.DirectMessages,
            ],
        });
    }

    async start() {
        try {
            await this.loadCommands();

            await this.client.login(ConfigManager.getConfig().discord.token);
            console.log(`logged in as ${this.client.user?.tag}`);

            DiscordLogger.getInstance().setClient(this.client);

            this.client.on('interactionCreate', async (interaction: Interaction) => {
                if (interaction instanceof AutocompleteInteraction) {
                    const command = this.commands.find(cmd => cmd.name === interaction.commandName);
                    if (!command) return;

                    try {
                        await command.autocomplete(interaction);
                    } catch (error) {
                        console.error('error handling autocomplete:', error);
                    }
                    return;
                }

                if (!(interaction instanceof CommandInteraction)) return;

                const command = this.commands.find(cmd => cmd.name === interaction.commandName);
                if (!command) return;

                try {
                    await command.execute(interaction);
                } catch (error) {
                    console.error('error executing command:', error);
                    if (!interaction.replied) {
                        await interaction.reply({
                            content: 'There was an error while executing this command!',
                            ephemeral: true
                        });
                    }
                }
            });
        } catch (error) {
            console.error('Failed to start Discord bot:', error);
            throw error;
        }
    }

    private async loadCommands() {
        this.commands = [
            new AddEmailCommand(),
            new RemoveEmailCommand(),
            new ListEmailsCommand(),
            new LinkAccountCommand(),
            new PingCommand(),
        ];

        let discordConfig = ConfigManager.getConfig().discord;

        const rest = new REST({ version: '10' }).setToken(discordConfig.token);

        try {
            const commandData = this.commands.map(command => command.data.toJSON());

            console.log(`refreshing ${commandData.length} application commands`);

            const data = await rest.put(
                Routes.applicationGuildCommands(discordConfig.clientId, discordConfig.guildId),
                { body: commandData },
            ) as APIApplicationCommand[];

            console.log(`successfully reloaded ${data.length} application commands`);
        } catch (error) {
            console.error('error reloading commands:', error);
            throw error;
        }
    }
}