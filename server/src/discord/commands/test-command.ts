import { CommandInteraction } from 'discord.js';
import Command from "../models/command";
import { UserId } from "@timothyw/pat-common";
import NotificationManager, { NotificationId, QueuedNotification } from "../../controllers/notification-manager";
import { NotificationHandler, NotificationType } from "../../models/notification-handler";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { addDays, isAfter, setHours, setMilliseconds, setMinutes, setSeconds } from "date-fns";

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

        const userTimezone = 'America/Los_Angeles';

        const now = new Date();
        const userNow = toZonedTime(now, userTimezone);

        let scheduledDate = setHours(setMinutes(setSeconds(setMilliseconds(userNow, 0), 0), 0), 21);

        // if (isAfter(userNow, scheduledDate)) {
        //     scheduledDate = addDays(scheduledDate, 1);
        // }

        const utcScheduledTime = fromZonedTime(scheduledDate, userTimezone);
        // const utcScheduledTime = scheduledDate;

        // print in mm-dd-yyyy hh:mm:ss format
        const formattedDate = `${utcScheduledTime.getMonth() + 1}-${utcScheduledTime.getDate()}-${utcScheduledTime.getFullYear()} ${utcScheduledTime.getHours()}:${utcScheduledTime.getMinutes()}:${utcScheduledTime.getSeconds()}`;
        await interaction.followUp(`(${scheduledDate.getTime()}) ${utcScheduledTime.getTime()}: ${formattedDate}`);

        // const userId = "68142858a2fa4d2f7546a9a9" as UserId;
        //
        // await NotificationManager.getInstance().sender.send([{
        //     notification: {
        //         id: "test" as NotificationId,
        //         handler: NotificationManager.getHandler(NotificationType.CLEAR_INBOX) as unknown as NotificationHandler,
        //         data: {
        //             type: NotificationType.CLEAR_INBOX,
        //             userId: userId,
        //             scheduledTime: Date.now() + 1000
        //         }
        //     },
        //     content: {
        //         title: "Test Notification",
        //         body: "This is a test notification sent from the test command!"
        //     }
        // }]);
        //
        // await interaction.editReply("Done");
    }
}