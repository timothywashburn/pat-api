import { UserId } from "@timothyw/pat-common";
import UserManager from "./user-manager";
import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { QueuedNotification } from "./notification-manager";
import { NotificationContent } from "../models/notification-handler";

type ToSend = {
    notification: QueuedNotification;
    content: NotificationContent;
}[];

export default class NotificationSender {
    private expo: Expo;

    constructor(expo: Expo) {
        this.expo = expo;
    }

    async send(toSend: ToSend): Promise<void> {
        try {
            const messages: ExpoPushMessage[] = [];

            for (const { notification, content } of toSend) {
                const userId = notification.data.userId;

                const user = await UserManager.getInstance().getById(userId);
                if (!user || !user.sandbox || !user.sandbox.devices || user.sandbox.devices.length === 0) {
                    console.log(`no devices found for user ${userId}`)
                    continue;
                }

                const pushTokens = user.sandbox.devices.map(device => device.pushToken);

                for (const pushToken of pushTokens) {
                    if (!Expo.isExpoPushToken(pushToken)) {
                        console.log(`invalid expo push token: ${pushToken}`)
                        continue;
                    }

                    messages.push({
                        to: pushToken,
                        sound: 'default',
                        title: (process.env.NODE_ENV === 'development' ? "(Dev) " : "") + content.title,
                        body: content.body,
                        // data (any = {})
                    });
                }
            }

            const chunks = this.expo.chunkPushNotifications(messages);
            const tickets: ExpoPushTicket[] = [];

            for (const chunk of chunks) {
                try {
                    const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
                    tickets.push(...ticketChunk);
                    console.log(`sent notifications chunk with ${chunk.length} messages`)
                } catch (error) {
                    console.log(`error sending notification chunk: ${error}`)
                }
            }

            await this.handlePushNotificationTickets(tickets);
        } catch (error) {
            console.log(`error in sendToDevices: ${error}`)
        }
    }

    private async handlePushNotificationTickets(tickets: ExpoPushTicket[]): Promise<void> {
        //     TODO: DO NOT IMPLEMENT YET
    }
}