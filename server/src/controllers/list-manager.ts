import {
    ListData,
    ListId,
    ListType,
    UpdateListRequest,
    UserId
} from "@timothyw/pat-common";
import { ListModel } from "../models/mongo/list-data";
import ListItemManager from "./list-item-manager";
import { AuthInfo } from "../api/types";
import { updateDocument } from "../utils/db-doc-utils";

export default class ListManager {
    private static instance: ListManager;

    private constructor() {}

    async create(userId: UserId, data: {
        name: string;
        type: ListType;
    }): Promise<ListData> {
        const list = new ListModel({
            userId,
            ...data
        });
        const doc = await list.save();
        return doc.toObject();
    }

    getById(listId: ListId): Promise<ListData | null> {
        return ListModel.findById(listId).lean();
    }

    getAllByUser(userId: UserId): Promise<ListData[]> {
        return ListModel.find({ userId }).sort({ createdAt: -1 }).lean();
    }

    update(
        auth: AuthInfo,
        listId: ListId,
        updates: UpdateListRequest
    ): Promise<ListData | null> {
        return updateDocument(auth, ListModel, listId, updates);
    }

    async delete(listId: ListId): Promise<boolean> {
        await ListItemManager.getInstance().deleteAllForList(listId);
        return ListModel.deleteOne({ _id: listId })
            .then(result => result.deletedCount > 0);
    }

    deleteAllForUser(userId: UserId): Promise<number> {
        return ListModel.deleteMany({ userId })
            .then(result => result.deletedCount);
    }

    getStats(userId: UserId): Promise<{
        total: number;
    }> {
        return ListModel.countDocuments({ userId })
            .then(total => ({ total }));
    }

    static getInstance(): ListManager {
        if (!ListManager.instance) ListManager.instance = new ListManager();
        return ListManager.instance;
    }
}