import mongoose, { Schema } from 'mongoose';
import type { RecommendText } from '../Discord/MessageInteraction/RecommendQueue.js';

const DcconListItemSchema = new Schema(
    {
        idx: { type: String, required: true },
        img: { type: String, required: true, default: '' },
    },
    { _id: false, id: false },
);

const UserSchema = new Schema({
    user_id: { type: String, required: true, unique: true },
    user_name: String,
    list: { type: [DcconListItemSchema], default: [] },
    user_mail: String,
});

UserSchema.pre('init', function normalizeLegacyList(data) {
    if (!Array.isArray(data.list)) return;
    data.list = data.list.map((item: unknown) =>
        typeof item === 'string' ? { idx: item, img: '' } : item,
    );
});

UserSchema.index({ user_id: 1, 'list.idx': 1 });

const ChannelSchema = new Schema({
    guild_id: { type: String, required: true, unique: true },
    channel_id: { type: [String], required: true, unique: true },
    count: { type: Number, required: true },
    decount: { type: Number, required: true },
    auto: { type: Boolean },
    version: Number,
});
ChannelSchema.index({ guild_id: 1 });

const data = new Schema<RecommendText>(
    {
        text: { type: String, required: true },
        image: { type: String },
        channel_id: { type: String, required: true },
        user_id: { type: String, required: true },
        user_name: { type: String, required: true },
        message_id: { type: String, required: true },
        message_id_history: { type: [String], required: true, default: [] },
        guild_id: { type: String, required: true },
        expire_at: { type: Number, required: true },
        count: { type: Number, required: true },
        decount: { type: Number, required: true },
    },
    {
        _id: false,
        id: false,
    },
);

const StateSchema = new Schema({
    channel_id: { type: String, required: true, unique: true },
    recommend_text: { type: [data], required: true, default: [] },
});
StateSchema.index({ channel_id: 1 });

const user = new Schema({
    user_id: { type: String, required: true, unique: true },
    join_date: { type: String, required: true },
});

const GuildSchema = new Schema({
    guild_id: { type: String, required: true, unique: true },
    user_info: { type: [user], required: true, default: [] },
});

export const User = mongoose.models['User'] || mongoose.model('User', UserSchema);
export const Channel = mongoose.models['Channel'] || mongoose.model('Channel', ChannelSchema);
export const State = mongoose.models['State'] || mongoose.model('State', StateSchema);
export const Guild = mongoose.models['Guild'] || mongoose.model('Guild', GuildSchema);
