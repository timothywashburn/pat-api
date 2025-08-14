import { Schema, model } from 'mongoose';
import { UserId } from '@timothyw/pat-common';

interface EntitySyncStateDocument {
    userId: UserId;
    entityType: string;
    entityId: string;
    synced: boolean;
    updatedAt: Date;
}

const entitySyncStateSchema = new Schema<EntitySyncStateDocument>({
    userId: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    synced: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: false,
    collection: 'entity_sync_states'
});

// Compound index for efficient lookups
entitySyncStateSchema.index({ userId: 1, entityType: 1, entityId: 1 }, { unique: true });

export const EntitySyncStateModel = model<EntitySyncStateDocument>('EntitySyncState', entitySyncStateSchema);