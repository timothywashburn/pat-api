import {
    ListItemData,
    ListItemId,
    UserId,
    ListId,
    UpdateItemRequest,
    ListType
} from "@timothyw/pat-common";
import { ListItemModel } from "../models/mongo/list-item-data";
import { AuthInfo } from "../api/types";
import { updateDocument } from "../utils/db-doc-utils";
import ListManager from "./list-manager";

export default class ListItemManager {
    private static instance: ListItemManager;

    private constructor() {}

    async create(userId: UserId, data: {
        name: string;
        notes?: string;
        listId: ListId;
    }): Promise<ListItemData> {
        const listItem = new ListItemModel({
            userId,
            ...data,
            completed: false
        });
        const doc = await listItem.save();
        return doc.toObject();
    }

    getById(listItemId: ListItemId): Promise<ListItemData | null> {
        return ListItemModel.findById(listItemId).lean();
    }

    getAllByUser(userId: UserId): Promise<ListItemData[]> {
        return ListItemModel.find({ userId }).lean();
    }

    update(
        auth: AuthInfo,
        listItemId: ListItemId,
        updates: UpdateItemRequest
    ): Promise<ListItemData | null> {
        return updateDocument(auth, ListItemModel, listItemId, updates);
    }

    async setCompleted(listItemId: ListItemId, completed: boolean): Promise<ListItemData | null> {
        const listItem = await ListItemModel.findById(listItemId).lean();
        if (!listItem) return null;

        const list = await ListManager.getInstance().getById(listItem.listId);
        if (list?.type === ListType.NOTES) throw new Error('Cannot mark items in note lists as completed');

        return ListItemModel.findByIdAndUpdate(
            listItemId,
            { $set: { completed } },
            { new: true }
        ).lean();
    }

    delete(listItemId: ListItemId): Promise<boolean> {
        return ListItemModel.deleteOne({ _id: listItemId })
            .then(result => result.deletedCount > 0);
    }

    deleteAllForUser(userId: UserId): Promise<number> {
        return ListItemModel.deleteMany({ userId })
            .then(result => result.deletedCount);
    }

    deleteAllForList(listId: ListId): Promise<number> {
        return ListItemModel.deleteMany({ taskListId: listId })
            .then(result => result.deletedCount);
    }

    getStats(userId: UserId): Promise<{
        total: number;
        completed: number;
        pending: number;
    }> {
        return Promise.all([
            ListItemModel.countDocuments({ userId }),
            ListItemModel.countDocuments({ userId, completed: true }),
            ListItemModel.countDocuments({ userId, completed: false })
        ]).then(([total, completed, pending]) => ({
            total,
            completed,
            pending
        }));
    }

    static getInstance(): ListItemManager {
        if (!ListItemManager.instance) ListItemManager.instance = new ListItemManager();
        return ListItemManager.instance;
    }
}