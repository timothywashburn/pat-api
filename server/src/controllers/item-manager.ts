import { CreateAgendaItemRequest, AgendaItemData, ItemId, UpdateAgendaItemRequest, UserId } from "@timothyw/pat-common";
import { ItemModel } from "../models/mongo/item-data";
import { updateDocument } from "../utils/db-doc-utils";

export default class ItemManager {
    private static instance: ItemManager;

    private constructor() {}

    async create(userId: UserId, data: CreateAgendaItemRequest): Promise<AgendaItemData> {
        const todo = new ItemModel({
            userId,
            ...data,
            completed: false,
            urgent: data.urgent ?? false,
            category: data.category ?? null,
            type: data.type ?? null
        });
        const doc = await todo.save();
        return doc.toObject();
    }

    async createMany(userId: UserId, dataArray: CreateAgendaItemRequest[]): Promise<AgendaItemData[]> {
        const items = dataArray.map(data => ({
            userId,
            ...data,
            completed: false,
            urgent: data.urgent ?? false,
            category: data.category ?? null,
            type: data.type ?? null
        }));
        const docs = await ItemModel.insertMany(items);
        return docs.map(doc => doc.toObject());
    }

    getById(itemId: ItemId): Promise<AgendaItemData | null> {
        return ItemModel.findById(itemId).lean();
    }

    getAllByUser(userId: UserId): Promise<AgendaItemData[]> {
        return ItemModel.find({ userId }).lean();
    }

    getPending(userId: UserId): Promise<AgendaItemData[]> {
        return ItemModel.find({
            userId,
            completed: false
        }).sort({ dueDate: 1 }).lean();
    }

    getOverdue(userId: UserId): Promise<AgendaItemData[]> {
        return ItemModel.find({
            userId,
            completed: false,
            dueDate: { $lt: new Date() }
        }).sort({ dueDate: 1 }).lean();
    }

    update(
        userId: UserId,
        itemId: ItemId,
        updates: UpdateAgendaItemRequest
    ): Promise<AgendaItemData | null> {
        return updateDocument<AgendaItemData, UpdateAgendaItemRequest>(userId, ItemModel, itemId, updates);
    }

    async updateMany(
        userId: UserId,
        items: Array<{ itemId: ItemId; updates: UpdateAgendaItemRequest }>
    ): Promise<Array<{ itemId: ItemId; item: AgendaItemData | null; success: boolean }>> {
        const results = await Promise.all(
            items.map(async ({ itemId, updates }) => {
                const item = await this.update(userId, itemId, updates);
                return {
                    itemId,
                    item,
                    success: item !== null
                };
            })
        );
        return results;
    }

    // update(
    //     itemId: ItemId,
    //     updates: Partial<Omit<ItemData, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>
    // ): Promise<ItemData | null> {
    //
    //     const set: any = {};
    //     const unset: any = {};
    //
    //     Object.entries(updates).forEach(([key, value]) => {
    //         if (value === null) {
    //             unset[key] = "";
    //         } else {
    //             set[key] = value;
    //         }
    //     });
    //
    //     const updateOperation: any = {};
    //     if (Object.keys(set).length > 0) updateOperation.$set = set;
    //     if (Object.keys(unset).length > 0) updateOperation.$unset = unset;
    //
    //     return ItemModel.findByIdAndUpdate(
    //         itemId,
    //         updateOperation,
    //         { new: true }
    //     );
    // }

    async setCompleted(userId: UserId, itemId: ItemId, completed: boolean) {
        return ItemModel.findOneAndUpdate(
            { _id: itemId, userId },
            { $set: { completed } },
            { new: true }
        ).lean();
    }

    async setCompletedMany(
        userId: UserId,
        itemIds: ItemId[],
        completed: boolean
    ): Promise<Array<{ itemId: ItemId; item: AgendaItemData | null; success: boolean }>> {
        const results = await Promise.all(
            itemIds.map(async (itemId) => {
                const item = await this.setCompleted(userId, itemId, completed);
                return {
                    itemId,
                    item,
                    success: item !== null
                };
            })
        );
        return results;
    }

    async clearItemCategory(userId: UserId, category: string): Promise<number> {
        const result = await ItemModel.updateMany(
            { userId, category },
            { $set: { category: null } }
        );
        return result.modifiedCount;
    }

    async clearItemType(userId: UserId, type: string): Promise<number> {
        const result = await ItemModel.updateMany(
            { userId, type },
            { $set: { type: null } }
        );
        return result.modifiedCount;
    }

    delete(userId: UserId, itemId: ItemId): Promise<boolean> {
        return ItemModel.deleteOne({ _id: itemId, userId })
            .then(result => result.deletedCount > 0);
    }

    async deleteManyItems(
        userId: UserId,
        itemIds: ItemId[]
    ): Promise<Array<{ itemId: ItemId; success: boolean }>> {
        const results = await Promise.all(
            itemIds.map(async (itemId) => {
                const success = await this.delete(userId, itemId);
                return {
                    itemId,
                    success
                };
            })
        );
        return results;
    }

    deleteAllForUser(userId: UserId): Promise<number> {
        return ItemModel.deleteMany({ userId })
            .then(result => result.deletedCount);
    }

    getStats(userId: UserId): Promise<{
        total: number;
        completed: number;
        pending: number;
        overdue: number;
    }> {
        return Promise.all([
            ItemModel.countDocuments({ userId }),
            ItemModel.countDocuments({ userId, completed: true }),
            ItemModel.countDocuments({ userId, completed: false }),
            ItemModel.countDocuments({
                userId,
                completed: false,
                dueDate: { $lt: new Date() }
            })
        ]).then(([total, completed, pending, overdue]) => ({
            total,
            completed,
            pending,
            overdue
        }));
    }

    static getInstance(): ItemManager {
        if (!ItemManager.instance) ItemManager.instance = new ItemManager();
        return ItemManager.instance;
    }
}