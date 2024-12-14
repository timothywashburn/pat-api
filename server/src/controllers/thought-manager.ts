import { Types } from "mongoose";
import { ThoughtData, ThoughtModel } from "../models/mongo/thought-data";

export default class ThoughtManager {
    private static instance: ThoughtManager;

    private constructor() {}

    create(userId: Types.ObjectId, data: {
        content: string;
    }): Promise<ThoughtData> {
        const thought = new ThoughtModel({
            userId,
            content: data.content
        });
        return thought.save();
    }

    getAllByUser(userId: Types.ObjectId): Promise<ThoughtData[]> {
        return ThoughtModel.find({ userId });
    }

    update(thoughtId: Types.ObjectId, updates: {
        content?: string;
    }): Promise<ThoughtData | null> {
        return ThoughtModel.findByIdAndUpdate(
            thoughtId,
            { $set: updates },
            { new: true }
        );
    }

    delete(thoughtId: Types.ObjectId): Promise<boolean> {
        return ThoughtModel.deleteOne({ _id: thoughtId })
            .then(result => result.deletedCount > 0);
    }

    static getInstance(): ThoughtManager {
        if (!ThoughtManager.instance) ThoughtManager.instance = new ThoughtManager();
        return ThoughtManager.instance;
    }
}