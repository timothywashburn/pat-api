import { TaskData, TaskId, UserId, TaskListId, ItemId, UpdateItemRequest, ItemData } from "@timothyw/pat-common";
import { TaskModel } from "../models/mongo/task-data";
import { AuthInfo } from "../api/types";
import { updateDocument } from "../utils/db-doc-utils";
import { ItemModel } from "../models/mongo/item-data";

export default class TaskManager {
    private static instance: TaskManager;

    private constructor() {}

    async create(userId: UserId, data: {
        name: string;
        notes?: string;
        taskListId: TaskListId;
    }): Promise<TaskData> {
        const task = new TaskModel({
            userId,
            ...data,
            completed: false
        });
        const doc = await task.save();
        return doc.toObject();
    }

    getById(taskId: TaskId): Promise<TaskData | null> {
        return TaskModel.findById(taskId).lean();
    }

    getAllByUser(userId: UserId): Promise<TaskData[]> {
        return TaskModel.find({ userId }).lean();
    }

    getByTaskList(userId: UserId, taskListId: TaskListId): Promise<TaskData[]> {
        return TaskModel.find({ userId, taskListId }).lean();
    }

    getPending(userId: UserId): Promise<TaskData[]> {
        return TaskModel.find({
            userId,
            completed: false
        }).sort({ createdAt: -1 }).lean();
    }

    getCompleted(userId: UserId): Promise<TaskData[]> {
        return TaskModel.find({
            userId,
            completed: true
        }).sort({ updatedAt: -1 }).lean();
    }

    update(
        auth: AuthInfo,
        taskId: TaskId,
        updates: UpdateItemRequest
    ): Promise<TaskData | null> {
        return updateDocument(auth, TaskModel, taskId, updates);
    }

    // update(
    //     taskId: TaskId,
    //     updates: Partial<Omit<TaskData, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>
    // ): Promise<TaskData | null> {
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
    //     return TaskModel.findByIdAndUpdate(
    //         taskId,
    //         updateOperation,
    //         { new: true }
    //     );
    // }

    async setCompleted(taskId: TaskId, completed: boolean): Promise<TaskData | null> {
        return TaskModel.findByIdAndUpdate(
            taskId,
            { $set: { completed } },
            { new: true }
        ).lean();
    }

    delete(taskId: TaskId): Promise<boolean> {
        return TaskModel.deleteOne({ _id: taskId })
            .then(result => result.deletedCount > 0);
    }

    deleteAllForUser(userId: UserId): Promise<number> {
        return TaskModel.deleteMany({ userId })
            .then(result => result.deletedCount);
    }

    deleteAllForTaskList(taskListId: TaskListId): Promise<number> {
        return TaskModel.deleteMany({ taskListId })
            .then(result => result.deletedCount);
    }

    getStats(userId: UserId): Promise<{
        total: number;
        completed: number;
        pending: number;
    }> {
        return Promise.all([
            TaskModel.countDocuments({ userId }),
            TaskModel.countDocuments({ userId, completed: true }),
            TaskModel.countDocuments({ userId, completed: false })
        ]).then(([total, completed, pending]) => ({
            total,
            completed,
            pending
        }));
    }

    static getInstance(): TaskManager {
        if (!TaskManager.instance) TaskManager.instance = new TaskManager();
        return TaskManager.instance;
    }
}