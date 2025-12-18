import mongoose, { Schema } from 'mongoose';

const TokenSchema = new Schema({
    user_id: { type: String, required: true, unique: true },
    access_token: {
        iv: { type: String, required: true },
        data: { type: String, required: true },
        tag: { type: String, required: true },
        _id: false,
    },
    refresh_token: {
        iv: { type: String, required: true },
        data: { type: String, required: true },
        tag: { type: String, required: true },
        _id: false,
    },
    expires_at: { type: Number, required: true },
});
TokenSchema.index({ user_id: 1 });
export default mongoose.models.Token || mongoose.model('Token', TokenSchema);
