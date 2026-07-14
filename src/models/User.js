import mongoose, { Schema } from 'mongoose';

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

// Existing documents can still contain string entries until they are rewritten.
UserSchema.pre('init', function normalizeLegacyList(data) {
    if (!Array.isArray(data.list)) return;
    data.list = data.list.map((item) => (typeof item === 'string' ? { idx: item, img: '' } : item));
});

UserSchema.index({ user_id: 1, 'list.idx': 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
