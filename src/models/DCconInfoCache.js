import mongoose, { Schema } from 'mongoose';

export const DCCON_INFO_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

const DcconPathSchema = new Schema(
    {
        addr: { type: String, required: true },
        ext: String,
    },
    { _id: false, id: false },
);

const DcconInfoSchema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        main_img: { type: String, required: true },
        idx: { type: String, required: true },
        path: { type: [DcconPathSchema], default: [] },
    },
    { _id: false, id: false },
);

const DCconInfoCacheSchema = new Schema(
    {
        idx: { type: String, required: true, unique: true },
        data: { type: DcconInfoSchema, required: true },
        fetchedAt: { type: Date, required: true },
        lastAccessedAt: { type: Date, required: true },
        refreshingAt: Date,
    },
    { versionKey: false },
);

DCconInfoCacheSchema.index(
    { lastAccessedAt: 1 },
    { expireAfterSeconds: DCCON_INFO_CACHE_TTL_SECONDS },
);

export default mongoose.models.DCconInfoCache ||
    mongoose.model('DCconInfoCache', DCconInfoCacheSchema);
