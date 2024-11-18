import {Types} from "mongoose";
import {TaskData, TaskModel} from "../models/task";

export default class TaskManager {
    private static instance: TaskManager;

    private constructor() {}

    create(userId: Types.ObjectId, data: {
        name: string;
        dueDate?: Date;
        notes?: string;
    }): Promise<TaskData> {
        const todo = new TaskModel({
            userId,
            ...data,
            completed: false
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
        return TaskModel.findByIdAndUpdate(
            todoId,
            { $set: updates },
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