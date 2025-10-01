import { UserId } from "@timothyw/pat-common";
import chalk from "chalk";

export default class Logger {
    static logSystem(message: string, payload?: Record<string, any>) {
        const logMessage = payload
            ? `[SYSTEM] ${message} ${JSON.stringify(payload, null, 2)}`
            : `[SYSTEM] ${message}`;
        console.log(chalk.blue(logMessage));
    }

    static logUser(userId: UserId, message: string, payload?: Record<string, any>) {
        const logMessage = payload
            ? `[@${userId}] ${message} ${JSON.stringify(payload, null, 2)}`
            : `[@${userId}] ${message}`;
        console.log(chalk.green(logMessage));
    }
}