import {
    TaskListData,
    TaskListId,
    TaskListType,
    UpdateTaskListRequest,
    UserId
} from "@timothyw/pat-common";
import { TaskListModel } from "../models/mongo/task-list-data";
import TaskManager from "./task-manager";
import { AuthInfo } from "../api/types";
import { updateDocument } from "../utils/db-doc-utils";

export default class TaskListManager {
    private static instance: TaskListManager;

    private constructor() {}

    async create(userId: UserId, data: {
        name: string;
        type: TaskListType;
    }): Promise<TaskListData> {
        const taskList = new TaskListModel({
            userId,
            ...data
        });
        const doc = await taskList.save();
        return doc.toObject();
    }

    getById(taskListId: TaskListId): Promise<TaskListData | null> {
        return TaskListModel.findById(taskListId).lean();
    }

    getAllByUser(userId: UserId): Promise<TaskListData[]> {
        return TaskListModel.find({ userId }).sort({ createdAt: -1 }).lean();
    }

    update(
        auth: AuthInfo,
        taskListId: TaskListId,
        updates: UpdateTaskListRequest
    ): Promise<TaskListData | null> {
        return updateDocument(auth, TaskListModel, taskListId, updates);
    }

    // update(
    //     taskListId: TaskListId,
    //     updates: Partial<Omit<TaskListData, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>
    // ): Promise<TaskListData | null> {
    //     const set: any = {};
    //     const unset: any = {};
    //
    //     Object.entries(updates).forEach(([key, value]) => {
    //         if (value === null || value === undefined) {
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
    //     return TaskListModel.findByIdAndUpdate(
    //         taskListId,
    //         updateOperation,
    //         { new: true }
    //     );
    // }

    async delete(taskListId: TaskListId): Promise<boolean> {
        await TaskManager.getInstance().deleteAllForTaskList(taskListId);
        return TaskListModel.deleteOne({ _id: taskListId })
            .then(result => result.deletedCount > 0);
    }

    deleteAllForUser(userId: UserId): Promise<number> {
        return TaskListModel.deleteMany({ userId })
            .then(result => result.deletedCount);
    }

    getStats(userId: UserId): Promise<{
        total: number;
    }> {
        return TaskListModel.countDocuments({ userId })
            .then(total => ({ total }));
    }

    static getInstance(): TaskListManager {
        if (!TaskListManager.instance) TaskListManager.instance = new TaskListManager();
        return TaskListManager.instance;
    }
}