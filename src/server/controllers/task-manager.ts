import { Types } from "mongoose";
import { TaskData, TaskModel } from "../models/mongo/task";

export default class TaskManager {
    private static instance: TaskManager;

    private constructor() {}

    create(userId: Types.ObjectId, data: {
        name: string;
        dueDate?: Date | null;
        notes?: string;
        urgent?: boolean;
        category?: string | null;
        type?: string | null;
    }): Promise<TaskData> {
        const todo = new TaskModel({
            userId,
            ...data,
            completed: false,
            urgent: data.urgent ?? false,
            category: data.category ?? null,
            type: data.type ?? null
        });
        return todo.save();
    }

    getById(todoId: Types.ObjectId): Promise<TaskData | null> {
        return TaskModel.findById(todoId);
    }

    getAllByUser(userId: Types.ObjectId): Promise<TaskData[]> {
        return TaskModel.find({ userId });
    }

    getPending(userId: Types.ObjectId): Promise<TaskData[]> {
        return TaskModel.find({
            userId,
            completed: false
        }).sort({ dueDate: 1 });
    }

    getOverdue(userId: Types.ObjectId): Promise<TaskData[]> {
        return TaskModel.find({
            userId,
            completed: false,
            dueDate: { $lt: new Date() }
        }).sort({ dueDate: 1 });
    }

    update(
        todoId: Types.ObjectId,
        updates: Partial<Omit<TaskData, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>
    ): Promise<TaskData | null> {

        const set: any = {};
        const unset: any = {};

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null) {
                unset[key] = "";
            } else {
                set[key] = value;
            }
        });

        const updateOperation: any = {};
        if (Object.keys(set).length > 0) updateOperation.$set = set;
        if (Object.keys(unset).length > 0) updateOperation.$unset = unset;

        return TaskModel.findByIdAndUpdate(
            todoId,
            updateOperation,
            { new: true }
        );
    }

    async setCompleted(taskId: Types.ObjectId, completed: boolean) {
        const task = await TaskModel.findByIdAndUpdate(
            taskId,
            { $set: { completed } },
            { new: true }
        );
        return task;
    }

    async clearTaskCategory(userId: Types.ObjectId, category: string): Promise<number> {
        const result = await TaskModel.updateMany(
            { userId, category },
            { $set: { category: null } }
        );
        return result.modifiedCount;
    }

    async clearTaskType(userId: Types.ObjectId, type: string): Promise<number> {
        const result = await TaskModel.updateMany(
            { userId, type },
            { $set: { type: null } }
        );
        return result.modifiedCount;
    }

    delete(todoId: Types.ObjectId): Promise<boolean> {
        return TaskModel.deleteOne({ _id: todoId })
            .then(result => result.deletedCount > 0);
    }

    deleteAllForUser(userId: Types.ObjectId): Promise<number> {
        return TaskModel.deleteMany({ userId })
            .then(result => result.deletedCount);
    }

    getStats(userId: Types.ObjectId): Promise<{
        total: number;
        completed: number;
        pending: number;
        overdue: number;
    }> {
        return Promise.all([
            TaskModel.countDocuments({ userId }),
            TaskModel.countDocuments({ userId, completed: true }),
            TaskModel.countDocuments({ userId, completed: false }),
            TaskModel.countDocuments({
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

    static getInstance(): TaskManager {
        if (!TaskManager.instance) TaskManager.instance = new TaskManager();
        return TaskManager.instance;
    }
}