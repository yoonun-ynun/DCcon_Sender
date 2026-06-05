import mongoose, { Schema } from 'mongoose';

const UsageSchema = new Schema({
    user_id: { type: String, required: true, unique: true },
    user_name: String,
    count: { type: Number, default: 0 },
});
UsageSchema.index({ user_id: 1 });

export default mongoose.models.Usage || mongoose.model('Usage', UsageSchema);
