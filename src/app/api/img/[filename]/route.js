import { GET as getImage } from '../route';

export const runtime = 'nodejs';

export async function GET(req) {
    return getImage(req);
}
