import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
    user_id: { type: String, required: true, unique: true },
    user_name: String,
    list: { type: [String], default: [] },
    user_mail: String,
});
UserSchema.index({ user_id: 1, list: 1 });

const ChannelSchema = new Schema({
    guild_id: { type: String, required: true, unique: true },
    channel_id: { type: [String], required: true, unique: true },
    count: { type: Number, required: true },
    decount: { type: Number, required: true },
    version: Number,
});
ChannelSchema.index({ guild_id: 1 });

export const User = mongoose.models['User'] || mongoose.model('User', UserSchema);
export const Channel = mongoose.models['Channel'] || mongoose.model('Channel', ChannelSchema);
