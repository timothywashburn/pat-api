import { CommandInteraction } from 'discord.js';
import Command from "../models/command";
import { UserId } from "@timothyw/pat-common";
import NotificationManager, { NotificationId, QueuedNotification } from "../../controllers/notification-manager";
import { NotificationHandler, NotificationType } from "../../models/notification-handler";

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

        await interaction.deferReply();

        const userId = "68142858a2fa4d2f7546a9a9" as UserId;

        await NotificationManager.getInstance().sender.send([{
            notification: {
                id: "test" as NotificationId,
                handler: NotificationManager.getHandler(NotificationType.CLEAR_INBOX) as unknown as NotificationHandler,
                data: {
                    type: NotificationType.CLEAR_INBOX,
                    userId: userId,
                    scheduledTime: Date.now() + 1000
                }
            },
            content: {
                title: "Test Notification",
                body: "This is a test notification sent from the test command!"
            }
        }]);

        await interaction.editReply("Done");
    }
}