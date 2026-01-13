import { Document, Model, UpdateQuery } from 'mongoose';
import { UserId } from '@timothyw/pat-common';

function flattenObject(obj: any, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {};

    Object.entries(obj).forEach(([key, value]) => {
        const keyPath = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(flattened, flattenObject(value, keyPath));
        } else if (value !== undefined) {
            flattened[keyPath] = value;
        }
    });

    return flattened;
}

export async function updateDocument<T, U extends object>(
    userId: UserId,
    model: Model<T>,
    id: string,
    updates: U
): Promise<T | null> {
    const set: Record<string, any> = {};
    const unset: Record<string, any> = {};

    const flatUpdates = flattenObject(updates);

    Object.entries(flatUpdates).forEach(([key, value]) => {
        if (value === null) {
            unset[key] = "";
        } else {
            set[key] = value;
        }
    });

    const updateOperation: UpdateQuery<T> = {};
    if (Object.keys(set).length > 0) updateOperation.$set = set;
    if (Object.keys(unset).length > 0) updateOperation.$unset = unset;

    return model.findOneAndUpdate(
        {
            _id: id,
            ...(userId === id ? {} : { userId })
        },
        updateOperation,
        { new: true }
    ).lean() as T;
}

export async function updateDocumentWithPopulate<T>(
    userId: UserId,
    model: Model<T>,
    id: string,
    updates: Partial<T>
): Promise<Document<any, any, T> & T | null> {
    const set: Record<string, any> = {};
    const unset: Record<string, any> = {};

    const flatUpdates = flattenObject(updates);

    Object.entries(flatUpdates).forEach(([key, value]) => {
        if (value === null) {
            unset[key] = "";
        } else {
            set[key] = value;
        }
    });

    const updateOperation: UpdateQuery<T> = {};
    if (Object.keys(set).length > 0) updateOperation.$set = set;
    if (Object.keys(unset).length > 0) updateOperation.$unset = unset;

    return model.findOneAndUpdate(
        { _id: id, userId },
        updateOperation,
        { new: true }
    );
}