import { Types } from "mongoose";
import { ThoughtModel } from "../models/mongo/thought-data";
import { ThoughtData, ThoughtId, UserId } from "@timothyw/pat-common";

export default class ThoughtManager {
    private static instance: ThoughtManager;

    private constructor() {}

    create(userId: UserId, data: {
        content: string;
    }): Promise<ThoughtData> {
        const thought = new ThoughtModel({
            userId,
            content: data.content
        });
        return thought.save();
    }

    getAllByUser(userId: UserId): Promise<ThoughtData[]> {
        return ThoughtModel.find({ userId });
    }

    update(thoughtId: ThoughtId, updates: {
        content?: string;
    }): Promise<ThoughtData | null> {
        return ThoughtModel.findByIdAndUpdate(
            thoughtId,
            { $set: updates },
            { new: true }
        );
    }

    delete(thoughtId: ThoughtId): Promise<boolean> {
        return ThoughtModel.deleteOne({ _id: thoughtId })
            .then(result => result.deletedCount > 0);
    }

    static getInstance(): ThoughtManager {
        if (!ThoughtManager.instance) ThoughtManager.instance = new ThoughtManager();
        return ThoughtManager.instance;
    }
}