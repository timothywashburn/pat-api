import { Document, Model, UpdateQuery } from 'mongoose';
import { AuthInfo } from "../api/types";

export async function updateDocument<T>(
    auth: AuthInfo,
    model: Model<T>,
    id: string,
    updates: Partial<T>
): Promise<T | null> {
    const set: Record<string, any> = {};
    const unset: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
            unset[key] = "";
        } else {
            set[key] = value;
        }
    });

    const updateOperation: UpdateQuery<T> = {};
    if (Object.keys(set).length > 0) updateOperation.$set = set;
    if (Object.keys(unset).length > 0) updateOperation.$unset = unset;

    return model.findByIdAndUpdate(
        { _id: id, userId: auth.userId },
        updateOperation,
        { new: true }
    ).lean() as T;
}