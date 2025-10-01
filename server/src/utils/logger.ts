import { UserId } from "@timothyw/pat-common";
import chalk from "chalk";

export enum LogType {
    SOCKET = "socket",
    NOTIFICATIONS = "notifications",

    UNCLASSIFIED = "unclassified",
}

export default class Logger {
    static logSystem(logType: LogType, message: string, payload?: Record<string, any>) {
        const logMessage = payload
            ? `[SYSTEM] [${logType}] ${message} ${JSON.stringify(payload, null, 2)}`
            : `[SYSTEM] [${logType}] ${message}`;
        console.log(chalk.blue(logMessage));
    }

    static logError(logType: LogType, message: string, payload?: Record<string, any>) {
        const logMessage = payload
            ? `[SYSTEM] [${logType}] ERROR: ${message} ${JSON.stringify(payload, null, 2)}`
            : `[SYSTEM] [${logType}] ERROR: ${message}`;
        console.error(chalk.red(logMessage));
    }

    static logUser(userId: UserId, logType: LogType, message: string, payload?: Record<string, any>) {
        const logMessage = payload
            ? `[${userId}] [${logType}] ${message} ${JSON.stringify(payload, null, 2)}`
            : `[${userId}] [${logType}] ${message}`;
        console.log(chalk.hex(this.getColorForUserId(userId))(logMessage));
    }

    static errorUser(userId: UserId, logType: LogType, message: string, payload?: Record<string, any>) {
        const logMessage = payload
            ? `[${userId}] [${logType}] ERROR: ${message} ${JSON.stringify(payload, null, 2)}`
            : `[${userId}] [${logType}] ERROR: ${message}`;
        console.error(chalk.red(logMessage));
    }

    private static getColorForUserId(userId: UserId): string {
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Generate readable color (avoid too dark or too light)
        // Hue: 0-360, Saturation: 60-80%, Lightness: 50-70%
        const hue = Math.abs(hash % 360);
        const saturation = 60 + (Math.abs(hash >> 8) % 20);
        const lightness = 50 + (Math.abs(hash >> 16) % 20);

        return this.hslToHex(hue, saturation, lightness);
    }

    private static hslToHex(h: number, s: number, l: number): string {
        l /= 100;
        const a = (s * Math.min(l, 1 - l)) / 100;
        const f = (n: number) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color)
                .toString(16)
                .padStart(2, "0");
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }
}