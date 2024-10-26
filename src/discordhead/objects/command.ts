import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export default abstract class Command {
    public name: string;
    public data: SlashCommandBuilder;

    constructor(name: string, description: string) {
        this.name = name;
        this.data = new SlashCommandBuilder()
            .setName(name)
            .setDescription(description);
    }

    abstract execute(interaction: CommandInteraction): Promise<void>;
}
