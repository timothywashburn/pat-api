import { CommandInteraction } from 'discord.js';
import Command from "../models/command";
import SocketManager from "../../controllers/socket-manager";
import { UserId } from "@timothyw/pat-common";

const ADMIN_DISCORD_ID = '458458767634464792';

export default class TestCommand extends Command {
    constructor() {
        super('test', 'developer command');
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        if (interaction.user.id !== ADMIN_DISCORD_ID) {
            await interaction.reply({
                content: 'You do not have permission to use this command',
                ephemeral: true
            });
            return;
        }

        const userId = "680ad990a48e44f93f78ada5" as UserId;
        SocketManager.getInstance().emitToUser(userId, "emailVerified");

        await interaction.reply("Done");
    }
}