import { CreateItemRequest, ItemData, ItemId, UpdateItemRequest, UserId } from "@timothyw/pat-common";
import { ItemModel } from "../models/mongo/item-data";
import { updateDocument } from "../utils/db-doc-utils";
import { AuthInfo } from "../api/types";

export default class ItemManager {
    private static instance: ItemManager;

    private constructor() {}

    async create(userId: UserId, data: CreateItemRequest): Promise<ItemData> {
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

    getById(itemId: ItemId): Promise<ItemData | null> {
        return ItemModel.findById(itemId).lean();
    }

    getAllByUser(userId: UserId): Promise<ItemData[]> {
        return ItemModel.find({ userId }).lean();
    }

    getPending(userId: UserId): Promise<ItemData[]> {
        return ItemModel.find({
            userId,
            completed: false
        }).sort({ dueDate: 1 }).lean();
    }

    getOverdue(userId: UserId): Promise<ItemData[]> {
        return ItemModel.find({
            userId,
            completed: false,
            dueDate: { $lt: new Date() }
        }).sort({ dueDate: 1 }).lean();
    }

    update(
        auth: AuthInfo,
        itemId: ItemId,
        updates: UpdateItemRequest
    ): Promise<ItemData | null> {
        return updateDocument<ItemData, UpdateItemRequest>(auth, ItemModel, itemId, updates);
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

    async setCompleted(itemId: ItemId, completed: boolean) {
        return ItemModel.findByIdAndUpdate(
            itemId,
            {$set: {completed}},
            {new: true}
        ).lean();
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

    delete(itemId: ItemId): Promise<boolean> {
        return ItemModel.deleteOne({ _id: itemId })
            .then(result => result.deletedCount > 0);
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