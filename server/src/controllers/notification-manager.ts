import ConfigManager from "./config-manager";
import UserManager from "./user-manager";
import { UserId } from "@timothyw/pat-common";
import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';

export default class NotificationManager {
    private static _expoToken: string;
    private static instance: NotificationManager;
    private expo: Expo;

    private constructor() {
        this.expo = new Expo();
    }

    static async init(): Promise<void> {
        this._expoToken = ConfigManager.getConfig().expo.token;
    }

    async sendToUser(userId: UserId, title: string, body: string, data: any = {}): Promise<void> {
        try {
            const user = await UserManager.getInstance().getById(userId);
            if (!user || !user.sandbox || !user.sandbox.devices || user.sandbox.devices.length === 0) {
                console.log(`no devices found for user ${userId}`)
                return;
            }

            const pushTokens = user.sandbox.devices.map(device => device.pushToken);
            console.log(`sending notification to ${pushTokens.length} devices for user ${userId}`)

            await this.sendToDevices(pushTokens, title, body, data);
        } catch (error) {
            console.log(`error sending notifications: ${error}`)
        }
    }

    async sendToDevices(pushTokens: string[], title: string, body: string, data: any = {}): Promise<void> {
        try {
            const messages: ExpoPushMessage[] = [];

            for (const pushToken of pushTokens) {
                if (!Expo.isExpoPushToken(pushToken)) {
                    console.log(`invalid expo push token: ${pushToken}`)
                    continue;
                }

                messages.push({
                    to: pushToken,
                    sound: 'default',
                    title,
                    body,
                    data
                });
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

            this.handlePushNotificationTickets(tickets);
        } catch (error) {
            console.log(`error in sendToDevices: ${error}`)
        }
    }

    private async handlePushNotificationTickets(tickets: ExpoPushTicket[]): Promise<void> {
    //     TODO: DO NOT IMPLEMENT YET
    }

    static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }
}