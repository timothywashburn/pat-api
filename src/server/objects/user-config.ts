import {model, Schema, Types} from "mongoose";

interface UserConfig {
    _id: Types.ObjectId;

    username: string;
    discordID: number;

    createdAt: Date;
    updatedAt: Date;
}

const userConfigSchema = new Schema<UserConfig>({
    username: {
        type: String,
        index: true
    },
    discordID: {
        type: Number,
        index: true
    }
}, {
    timestamps: true,
});

const UserConfigModel = model<UserConfig>('UserConfig', userConfigSchema);

export {
    UserConfig,
    UserConfigModel
};