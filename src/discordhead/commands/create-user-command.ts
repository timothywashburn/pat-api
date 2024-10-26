import { CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Command from "../objects/command";
import UserManager from "../../server/controllers/user-manager";

const ADMIN_DISCORD_ID = '458458767634464792';

export default class CreateUserCommand extends Command {
    constructor() {
        super('createuser', 'Create a new user profile');
        this.data
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('The Discord user to create a profile for')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('username')
                    .setDescription('The username for the profile')
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
        const targetUser = options.getUser('user', true);
        const username = options.getString('username', true);

        const exists = await UserManager.getInstance().exists(targetUser.id);
        if (exists) {
            await interaction.reply({
                content: 'A user profile already exists for this Discord user',
                ephemeral: true
            });
            return;
        }

        try {
            const user = await UserManager.getInstance().create(
                username,
                targetUser.id
            );

            await interaction.reply({
                content: `Successfully created user profile for ${targetUser.toString()} with username: ${user.username}`,
                allowedMentions: { users: [targetUser.id] }
            });
        } catch (error) {
            await interaction.reply({
                content: 'An error occurred while creating the user profile',
                ephemeral: true
            });
        }
    }
}