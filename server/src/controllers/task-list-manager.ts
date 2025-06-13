import { TaskListData, TaskListId, UserId } from "@timothyw/pat-common";
import { TaskListModel } from "../models/mongo/task-list-data";
import TaskManager from "./task-manager";

export default class TaskListManager {
    private static instance: TaskListManager;

    private constructor() {}

    create(userId: UserId, data: {
        name: string;
    }): Promise<TaskListData> {
        const taskList = new TaskListModel({
            userId,
            ...data
        });
        return taskList.save();
    }

    getById(taskListId: TaskListId): Promise<TaskListData | null> {
        return TaskListModel.findById(taskListId);
    }

    getAllByUser(userId: UserId): Promise<TaskListData[]> {
        return TaskListModel.find({ userId }).sort({ createdAt: -1 });
    }

    update(
        taskListId: TaskListId,
        updates: Partial<Omit<TaskListData, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>
    ): Promise<TaskListData | null> {
        const set: any = {};
        const unset: any = {};

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                unset[key] = "";
            } else {
                set[key] = value;
            }
        });

        const updateOperation: any = {};
        if (Object.keys(set).length > 0) updateOperation.$set = set;
        if (Object.keys(unset).length > 0) updateOperation.$unset = unset;

        return TaskListModel.findByIdAndUpdate(
            taskListId,
            updateOperation,
            { new: true }
        );
    }

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