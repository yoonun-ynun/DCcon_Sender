import crypto from 'node:crypto';

export function encrypt(value) {
    const key = Buffer.from(process.env.AES_KEY, 'hex');

    /** @type { Buffer } */
    const iv = crypto.randomBytes(12);

    /** @type {import('node:crypto').CipherGCM} */
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(value, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    /** @type { Uint8Array } */
    const raw_tag = cipher.getAuthTag();
    const tag = Buffer.from(raw_tag).toString('base64');

    return {
        iv: iv.toString('base64'),
        data: encrypted,
        tag,
    };
}

export function decrypt(encryptedObject) {
    const key = Buffer.from(process.env.AES_KEY, 'hex');
    const iv = Buffer.from(encryptedObject.iv, 'base64');
    const data = Buffer.from(encryptedObject.data, 'base64');
    const tag = Buffer.from(encryptedObject.tag, 'base64');

    /** @type {import('node:crypto').DecipherGCM} */
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

    decipher.setAuthTag(tag);

    let decrypted;
    try {
        decrypted = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    } catch (e) {
        throw new Error('Could not decrypt encrypted');
    }

    return decrypted;
}
