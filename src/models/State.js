import mongoose, { Schema } from 'mongoose';

const data = new Schema(
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

export default mongoose.models.State || mongoose.model('State', StateSchema);
