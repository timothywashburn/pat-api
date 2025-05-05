import { CommandInteraction } from 'discord.js';
import Command from "../models/command";
import SocketManager from "../../controllers/socket-manager";
import NotificationManager from "../../controllers/notification-manager";
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

        const userId = "68142858a2fa4d2f7546a9a9" as UserId;
        await NotificationManager.getInstance().sendToUser(
            userId,
            "Test Notification",
            "This is a test notification sent from the test command!",
            { source: "discord", command: "test" }
        );

        await interaction.reply("Done");
    }
}