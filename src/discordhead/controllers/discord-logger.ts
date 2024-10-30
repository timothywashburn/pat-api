import { Client, TextChannel, DiscordAPIError } from 'discord.js';
import ConfigManager from "../../server/controllers/config-manager";

export default class DiscordLogger {
    private static instance: DiscordLogger;
    private client: Client | null = null;
    private logChannel: TextChannel | null = null;
    private messageQueue: string[] = [];
    private isProcessing: boolean = false;
    private startTime: Date | null = null;
    private hasLoggedChannelError: boolean = false;

    private constructor() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            originalLog.apply(console, args);
            this.log('INFO', ...args);
        };

        console.error = (...args) => {
            originalError.apply(console, args);
            this.log('ERROR', ...args);
        };

        console.warn = (...args) => {
            originalWarn.apply(console, args);
            this.log('WARN', ...args);
        };

        process.on('SIGINT', () => this.handleShutdown('SIGINT'));
        process.on('SIGTERM', () => this.handleShutdown('SIGTERM'));
        process.on('uncaughtException', (error) => this.handleUncaughtException(error));
        process.on('unhandledRejection', (error) => this.handleUnhandledRejection(error));
    }

    private async handleShutdown(signal: string) {
        const uptime = this.getUptime();
        await this.sendLogMessage('SYSTEM', `🔴 Bot is shutting down (${signal})${uptime}`, true);
        process.exit(0);
    }

    private async handleUncaughtException(error: Error) {
        await this.sendLogMessage('ERROR', `Uncaught Exception: ${error.message}\n${error.stack}`, true);
        const uptime = this.getUptime();
        await this.sendLogMessage('SYSTEM', `🔴 Bot is shutting down (uncaught exception)${uptime}`, true);
        process.exit(1);
    }

    private async handleUnhandledRejection(error: any) {
        await this.sendLogMessage('ERROR', `Unhandled Promise Rejection: ${error}`, true);
    }

    private getUptime(): string {
        if (!this.startTime) return '';

        const uptime = Date.now() - this.startTime.getTime();
        const hours = Math.floor(uptime / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        const seconds = Math.floor((uptime % 60000) / 1000);

        return ` (Uptime: ${hours}h ${minutes}m ${seconds}s)`;
    }

    static getInstance(): DiscordLogger {
        if (!DiscordLogger.instance) {
            DiscordLogger.instance = new DiscordLogger();
        }
        return DiscordLogger.instance;
    }

    setClient(client: Client) {
        this.client = client;
        this.startTime = new Date();
        this.updateLogChannel();
    }

    private async clearLogChannelConfig() {
        const configManager = new ConfigManager();
        const currentConfig = ConfigManager.getConfig();
        await configManager.update({
            discord: {
                ...currentConfig.discord,
                logChannelId: undefined
            }
        });
        this.logChannel = null;
        this.hasLoggedChannelError = false;
    }

    private isDiscordChannelError(error: any): boolean {
        return error instanceof DiscordAPIError &&
            (error.code === 10003 || // Unknown Channel
                error.code === 50001 || // Missing Access
                error.code === 50013);  // Missing Permissions
    }

    async updateLogChannel() {
        if (!this.client) return;

        const config = ConfigManager.getConfig();
        if (!config.discord.logChannelId) {
            this.logChannel = null;
            return;
        }

        try {
            const channel = await this.client.channels.fetch(config.discord.logChannelId);
            if (!(channel instanceof TextChannel)) {
                await this.clearLogChannelConfig();
                return;
            }

            const permissions = channel.permissionsFor(this.client.user!);
            if (!permissions?.has(['SendMessages', 'ViewChannel', 'Administrator'])) {
                if (!this.hasLoggedChannelError) {
                    console.warn(`Missing permissions in log channel ${channel.name}`);
                    this.hasLoggedChannelError = true;
                }
                return;
            }

            this.logChannel = channel;
            this.hasLoggedChannelError = false;

            if (this.startTime) {
                await this.sendLogMessage('SYSTEM', `🟢 Bot is starting up (Version: ${process.env.npm_package_version || 'unknown'})`);
                await this.sendLogMessage('INFO', `Client connected as ${this.client.user?.tag}`);
            }

            this.processQueue();

        } catch (error) {
            if (this.isDiscordChannelError(error)) {
                await this.clearLogChannelConfig();
            } else if (!this.hasLoggedChannelError) {
                console.error('Failed to fetch log channel:', error);
                this.hasLoggedChannelError = true;
            }
        }
    }

    private async sendLogMessage(level: string, message: string, immediate: boolean = false) {
        const timestamp = new Date().toISOString();
        const formattedMessage = `\`${timestamp}\` **${level}:** ${message}`;

        if (this.logChannel) {
            try {
                if (immediate) {
                    await this.logChannel.send(formattedMessage);
                } else {
                    this.messageQueue.push(formattedMessage);
                    this.processQueue();
                }
            } catch (error) {
                if (this.isDiscordChannelError(error)) {
                    await this.clearLogChannelConfig();
                }
            }
        }
    }

    private async processQueue() {
        if (this.isProcessing || !this.logChannel || this.messageQueue.length === 0) return;

        this.isProcessing = true;
        try {
            while (this.messageQueue.length > 0) {
                const message = this.messageQueue.shift()!;
                await this.logChannel.send(message).catch(async (error) => {
                    if (this.isDiscordChannelError(error)) {
                        await this.clearLogChannelConfig();
                        throw error; // Stop processing queue
                    }
                    console.error('Error sending log message:', error);
                });
            }
        } finally {
            this.isProcessing = false;
        }
    }

    private log(level: 'INFO' | 'ERROR' | 'WARN', ...args: any[]) {
        const message = args
            .map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
            .join(' ');

        this.sendLogMessage(level, message);
    }
}