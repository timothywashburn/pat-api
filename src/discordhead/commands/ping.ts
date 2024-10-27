import { CommandInteraction } from 'discord.js';
import Command from "../objects/command";

export default class PingCommand extends Command {
    constructor() {
        super('ping', 'Shows the bot latency');
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.reply('pinging...');
        const latency = Date.now() - interaction.createdTimestamp;
        await interaction.editReply(
            `pong! latency: ${latency}ms`
        );
    }
}