import {
    APIApplicationCommand,
    Client,
    REST,
    CommandInteraction,
    Interaction,
    GatewayIntentBits, AutocompleteInteraction
} from 'discord.js';
import { Routes } from 'discord-api-types/v10';
import Command from "./objects/command";
import PingCommand from "./commands/ping";
import CreateTaskCommand from "./commands/create-task-command";
import DeleteTaskCommand from "./commands/delete-task-command";
import ListTasksCommand from "./commands/list-tasks-command";
import dotenv from 'dotenv';
import CreateUserCommand from "./commands/create-user-command";

export default class Bot {
    private client: Client;
    private commands: Command[] = [];

    private readonly token: string;
    private readonly clientId: string;
    private readonly guildId: string;

    constructor() {
        this.validateEnvironmentVariables();

        this.token = process.env.DISCORD_TOKEN!;
        this.clientId = process.env.DISCORD_CLIENT_ID!;
        this.guildId = process.env.DISCORD_GUILD_ID!;

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.DirectMessages,
            ],
        });

        this.start();
    }

    private validateEnvironmentVariables() {
        const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'DISCORD_GUILD_ID'];
        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    async start() {
        try {
            await this.loadCommands();

            this.client.once('ready', () => {
                console.log(`Logged in as ${this.client.user?.tag}`);
            });

            this.client.on('interactionCreate', async (interaction: Interaction) => {
                if (interaction instanceof AutocompleteInteraction) {
                    const command = this.commands.find(cmd => cmd.name === interaction.commandName);
                    if (!command) return;

                    try {
                        await command.autocomplete(interaction);
                    } catch (error) {
                        console.error('Error handling autocomplete:', error);
                    }
                    return;
                }

                if (!(interaction instanceof CommandInteraction)) return;

                const command = this.commands.find(cmd => cmd.name === interaction.commandName);
                if (!command) return;

                try {
                    await command.execute(interaction);
                } catch (error) {
                    console.error('Error executing command:', error);
                    if (!interaction.replied) {
                        await interaction.reply({
                            content: 'There was an error while executing this command!',
                            ephemeral: true
                        });
                    }
                }
            });

            await this.client.login(this.token);
        } catch (error) {
            console.error('Error starting bot:', error);
            process.exit(1);
        }
    }

    private async loadCommands() {
        this.commands = [
            new CreateTaskCommand(),
            new DeleteTaskCommand(),
            new ListTasksCommand(),
            new CreateUserCommand(),
            new PingCommand()
        ];

        const rest = new REST({ version: '10' }).setToken(this.token);

        try {
            const commandData = this.commands.map(command => command.data.toJSON());

            console.log(`Started refreshing ${commandData.length} application (/) commands.`);

            const data = await rest.put(
                Routes.applicationGuildCommands(this.clientId, this.guildId),
                { body: commandData },
            ) as APIApplicationCommand[];

            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
            console.error('Error reloading commands:', error);
            throw error;
        }
    }
}