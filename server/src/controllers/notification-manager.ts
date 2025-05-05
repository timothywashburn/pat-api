import ConfigManager from "./config-manager";
import UserManager from "./user-manager";
import { UserId } from "@timothyw/pat-common";

export default class NotificationManager {
    private static _expoToken: string;
    private static instance: NotificationManager;

    private constructor() {}

    static async init(): Promise<void> {
        this._expoToken = ConfigManager.getConfig().expo.token;
    }

    /**
     * Send a push notification to all devices registered to a user
     */
    async sendToUser(userId: UserId, title: string, body: string, data: any = {}): Promise<void> {
        try {
            // Get user from database
            const user = await UserManager.getInstance().getById(userId);
            if (!user || !user.sandbox || !user.sandbox.devices || user.sandbox.devices.length === 0) {
                console.log(`no devices found for user ${userId}`)
                return;
            }

            // Send notification to each device
            const devices = user.sandbox.devices;
            console.log(`sending notification to ${devices.length} devices for user ${userId}`)

            const promises = devices.map(device =>
                this.sendToDevice(device.pushToken, title, body, data)
            );

            await Promise.all(promises);
        } catch (error) {
            console.log(`error sending notifications: ${error}`)
        }
    }

    /**
     * Send a push notification to a specific device
     */
    async sendToDevice(pushToken: string, title: string, body: string, data: any = {}): Promise<void> {
        try {
            const message = {
                to: pushToken,
                sound: 'default',
                title,
                body,
                data
            };

            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.log(`push notification api error: ${JSON.stringify(errorData)}`)
            } else {
                console.log(`notification sent to device ${pushToken}`)
            }
        } catch (error) {
            console.log(`error sending notification to device: ${error}`)
        }
    }

    static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }
}