import mongoose, { Schema } from 'mongoose';

export const DCCON_IMAGE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

const DCconImageCacheSchema = new Schema(
    {
        url: { type: String, required: true, unique: true },
        data: { type: Buffer, required: true },
        contentType: { type: String, required: true },
        byteLength: { type: Number, required: true },
        fetchedAt: { type: Date, required: true },
        expiresAt: { type: Date, required: true },
    },
    { versionKey: false },
);

DCconImageCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.DCconImageCache ||
    mongoose.model('DCconImageCache', DCconImageCacheSchema);
