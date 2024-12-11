import { Client, Message, TextChannel } from 'discord.js';
import { ItemData } from "../../server/models/mongo/item-data";
import UserManager from "../../server/controllers/user-manager";
import ItemManager from "../../server/controllers/item-manager";
import { UserConfig } from "../../server/models/mongo/user-config";
import { Types } from 'mongoose';

interface ItemCategories {
    overdue: ItemData[];
    upcoming: ItemData[];
    undated: ItemData[];
}

interface Tracker {
    channelId: string;
    messageId: string;
    interval: NodeJS.Timeout;
    discordId: string;  // Keep Discord ID for Discord-specific operations
}

export default class ItemListManager {
    private static instance: ItemListManager;
    private activeTrackers: Map<string, Tracker> = new Map();  // Key is userId string
    private client: Client | null = null;

    static getInstance(): ItemListManager {
        if (!ItemListManager.instance) {
            ItemListManager.instance = new ItemListManager();
        }
        return ItemListManager.instance;
    }

    setClient(client: Client) {
        this.client = client;
    }

    async initializeTrackers() {
        if (!this.client) throw new Error('Client not set');

        const users = await UserManager.getInstance().getAllWithTracking();

        for (const user of users) {
            if (!user.itemListTracking || !user.discordID) continue;

            try {
                const channel = await this.client.channels.fetch(user.itemListTracking.channelId);
                if (!(channel instanceof TextChannel)) continue;

                const message = await channel.messages.fetch(user.itemListTracking.messageId).catch(() => null);
                if (!message) {
                    await UserManager.getInstance().update(user._id, { itemListTracking: undefined });
                    continue;
                }

                await this.startTracking(user.itemListTracking.channelId, user._id.toString(), user.discordID, message);
            } catch (error) {
                console.error('Error initializing tracker:', error);
                await UserManager.getInstance().update(user._id, { itemListTracking: undefined });
            }
        }
    }

    static formatItemList(items: ItemData[], user: UserConfig, autoUpdate: boolean = false): string {
        const now = new Date();

        const categorizedItems = items
            .filter(item => !item.completed)
            .reduce<ItemCategories>((acc, item) => {
                if (!item.dueDate) {
                    acc.undated.push(item);
                } else if (item.dueDate < now) {
                    acc.overdue.push(item);
                } else {
                    acc.upcoming.push(item);
                }
                return acc;
            }, {
                overdue: [],
                upcoming: [],
                undated: []
            });

        categorizedItems.overdue.sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());
        categorizedItems.upcoming.sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());
        categorizedItems.undated.sort((a, b) => a.name.localeCompare(b.name));

        const sections = [`# Item List for ${user.name}`];

        if (categorizedItems.overdue.length > 0) {
            const overdueItems = categorizedItems.overdue
                .map((item, index) => {
                    const timestamp = Math.floor(item.dueDate!.getTime() / 1000);
                    return `${index + 1}. ${item.name} (<t:${timestamp}:R>)`;
                })
                .join('\n');
            sections.push(`**Overdue:**\n${overdueItems}`);
        }

        if (categorizedItems.upcoming.length > 0) {
            const upcomingItems = categorizedItems.upcoming
                .map((item, index) => {
                    const timestamp = Math.floor(item.dueDate!.getTime() / 1000);
                    return `${index + 1}. ${item.name} (<t:${timestamp}:R>)`;
                })
                .join('\n');
            sections.push(`**Upcoming:**\n${upcomingItems}`);
        }

        if (categorizedItems.undated.length > 0) {
            const undatedItems = categorizedItems.undated
                .map((item, index) => `${index + 1}. ${item.name}`)
                .join('\n');
            sections.push(`**Undated:**\n${undatedItems}`);
        }

        if (sections.length === 1) sections.push('No pending items');

        if (autoUpdate) sections.push(`*Last updated: <t:${Math.floor(Date.now() / 1000)}:R>*`);

        return sections.join('\n\n');
    }

    async refreshList(userId: string, message: Message): Promise<void> {
        try {
            const channel = await this.client!.channels.fetch(message.channelId).catch(() => null);
            if (!channel || !(channel instanceof TextChannel)) {
                this.stopTracking(userId);
                return;
            }

            const messageCheck = await channel.messages.fetch(message.id).catch(() => null);
            if (!messageCheck) {
                this.stopTracking(userId);
                return;
            }

            const user = await UserManager.getInstance().getById(new Types.ObjectId(userId));
            if (!user) {
                this.stopTracking(userId);
                return;
            }

            const updatedItems = await ItemManager.getInstance().getAllByUser(user._id);
            const updatedList = ItemListManager.formatItemList(updatedItems, user, true);
            await message.edit(updatedList);
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'code' in error) {
                if (error.code === 10008 || error.code === 10003) {
                    this.stopTracking(userId);
                    return;
                }
            }
            console.error('Error updating item list:', error);
        }
    }

    async startTracking(
        channelId: string,
        userId: string,
        discordId: string,
        existingMessage?: Message
    ): Promise<boolean> {
        this.stopTracking(userId);

        if (!this.client) throw new Error('Client not set');

        const channel = await this.client.channels.fetch(channelId).catch(() => null);
        if (!channel || !(channel instanceof TextChannel)) return false;

        const user = await UserManager.getInstance().getById(new Types.ObjectId(userId));
        if (!user) return false;

        try {
            let message: Message;
            if (existingMessage) {
                const messageCheck = await channel.messages.fetch(existingMessage.id).catch(() => null);
                if (!messageCheck) return false;
                message = messageCheck;
            } else {
                const items = await ItemManager.getInstance().getAllByUser(user._id);
                const formattedList = ItemListManager.formatItemList(items, user, true);
                message = await channel.send(formattedList);
            }

            const boundRefreshList = () => this.refreshList(userId, message);
            await boundRefreshList();
            const interval = setInterval(boundRefreshList, 10000);

            this.activeTrackers.set(userId, {
                channelId,
                messageId: message.id,
                interval,
                discordId
            });

            if (!existingMessage) {
                await UserManager.getInstance().update(user._id, {
                    itemListTracking: {
                        channelId,
                        messageId: message.id
                    }
                });
            }

            return true;
        } catch (error) {
            console.error('Error starting item tracking:', error);
            return false;
        }
    }

    stopTracking(userId: string): void {
        const tracker = this.activeTrackers.get(userId);
        if (tracker) {
            clearInterval(tracker.interval);
            this.activeTrackers.delete(userId);

            UserManager.getInstance()
                .update(new Types.ObjectId(userId), { itemListTracking: undefined })
                .catch(console.error);
        }
    }

    isTracking(userId: string): boolean {
        return this.activeTrackers.has(userId);
    }
}