import crypto from 'crypto';

export function generateUUID(): string {
    return crypto.randomUUID();
}

export function generateRandomString(
    length: number,
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
): string {
    let result = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        result += chars[array[i]! % chars.length];
    }
    return result;
}

export function generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

export function generateOTP(length: number = 6): string {
    let result = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        result += (array[i]! % 10).toString();
    }
    return result;
}

export function generateTimeId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.floor(Math.random() * 1e8).toString(36);
    return `${timestamp}-${random}`;
}

export function generatePassword({ length = 16 }: { length?: number }): string {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
}

export function generateHash(input: string, method: string = 'sha256'): string {
    if (!input) return '';
    try {
        return crypto.createHash(method).update(input).digest('hex');
    } catch (e) {
        return '';
    }
}

export function generateRandomHex(): string {
    return crypto.randomBytes(32).toString('hex'); // 64 symbols
}
