import mongoose, { Schema } from 'mongoose';

const DCconTopCacheSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['day', 'week', 'month'],
            required: true,
            unique: true,
        },
        periodKey: { type: String, required: true },
        data: { type: [Schema.Types.Mixed], required: true },
        fetchedAt: { type: Date, required: true },
    },
    { versionKey: false },
);

export default mongoose.models.DCconTopCache ||
    mongoose.model('DCconTopCache', DCconTopCacheSchema);
