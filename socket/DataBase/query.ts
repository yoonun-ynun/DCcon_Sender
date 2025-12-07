import { User } from './models.js';

export async function getList(user_id: string) {
    const result = await User.findOne({ user_id: user_id }, { _id: 0, list: 1 }).lean<{
        list: string[];
    }>();
    return result?.list ?? [];
}
