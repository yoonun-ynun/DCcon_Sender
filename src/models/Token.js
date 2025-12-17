import mongoose, { Schema } from 'mongoose';

const TokenSchema = new Schema({
    user_id: { type: String, required: true, unique: true },
    access_token: String,
    refresh_token: String,
    expires_at: Number,
});
TokenSchema.index({ user_id: 1 });
export default mongoose.models.Token || mongoose.model('Token', TokenSchema);
