import { CommandInteraction } from 'discord.js';
import Command from "../objects/command";

export default class PingCommand extends Command {
    constructor() {
        super('ping', 'Replies with Pong!');
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.reply('Pong!');
    }
}
