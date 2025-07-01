import { ThoughtModel } from "../models/mongo/thought-data";
import {
    ThoughtData,
    ThoughtId,
    UpdateThoughtRequest,
    UserId
} from "@timothyw/pat-common";
import { AuthInfo } from "../api/types";
import { updateDocument } from "../utils/db-doc-utils";

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
        return ThoughtModel.find({ userId }).lean();
    }

    update(
        auth: AuthInfo,
        thoughtId: ThoughtId,
        updates: UpdateThoughtRequest
    ): Promise<ThoughtData | null> {
        return updateDocument(auth, ThoughtModel, thoughtId, updates);
    }

    // update(thoughtId: ThoughtId, updates: {
    //     content?: string;
    // }): Promise<ThoughtData | null> {
    //     return ThoughtModel.findByIdAndUpdate(
    //         thoughtId,
    //         { $set: updates },
    //         { new: true }
    //     );
    // }

    delete(thoughtId: ThoughtId): Promise<boolean> {
        return ThoughtModel.deleteOne({ _id: thoughtId })
            .then(result => result.deletedCount > 0);
    }

    static getInstance(): ThoughtManager {
        if (!ThoughtManager.instance) ThoughtManager.instance = new ThoughtManager();
        return ThoughtManager.instance;
    }
}