import { CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Command from "../models/command";
import UserManager from "../../controllers/user-manager";
import {AuthDataModel} from "../../models/mongo/auth-data";
import { UserId } from "@timothyw/pat-common";
import { AuthInfo } from "../../api/types";

const ADMIN_DISCORD_ID = '458458767634464792';

export default class LinkAccountCommand extends Command {
    constructor() {
        super('link', 'Link a Discord account to an existing user profile');
        this.data
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('The Discord user to link')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('email')
                    .setDescription('The email address associated with the account')
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
        const targetUser = options.getUser('user', true);
        // @ts-ignore
        const email = options.getString('email', true).toLowerCase();

        try {
            const auth = await AuthDataModel.findOne({ email });

            if (!auth) {
                await interaction.reply({
                    content: 'No account found with that email address',
                    ephemeral: true
                });
                return;
            }

            const authInfo: AuthInfo = {
                authId: auth._id,
                userId: auth.userId,
            }

            const updatedUser = await UserManager.getInstance().update(
                authInfo,
                auth.userId as UserId,
                {
                    sandbox: {
                        discordId: targetUser.id
                    }
                }
            );

            if (!updatedUser) {
                await interaction.reply({
                    content: 'An error occurred while linking the account',
                    ephemeral: true
                });
                return;
            }

            await interaction.reply({
                content: `Successfully linked ${targetUser.toString()} to profile: ${updatedUser.name}`,
                allowedMentions: { users: [targetUser.id] }
            });

        } catch (error) {
            console.error('Error in link command:', error);
            await interaction.reply({
                content: 'An error occurred while processing your request',
                ephemeral: true
            });
        }
    }
}