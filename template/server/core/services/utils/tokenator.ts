import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import ms from 'ms';

import { getEnv } from './envWorker.js';
import { generateRandomHex } from './generators.js';

import type { StringValue } from 'ms';
import type { Secret, Algorithm } from 'jsonwebtoken';
import type {
    TokenSignProps,
    TokenPayload,
    TokenOptions,
    VerifyOptions,
    VerifyResult,
    ModJwtPayload,
} from '../../types/tokenTypes';

function getTokenCfg() {
    const {
        JWT_PRIVATE_KEY_PATH,
        JWT_PUBLIC_KEY_PATH,
        JWT_ALGO,
        JWT_ISSUER_URLS,
        JWT_ACCESS_TOKEN_TTL,
        JWT_REFRESH_TOKEN_TTL,
        JWT_ACTION_TOKEN_TTL,
    } = getEnv();

    return {
        privateKey: fs.readFileSync(JWT_PRIVATE_KEY_PATH) as Secret,
        publicKey: fs.readFileSync(JWT_PUBLIC_KEY_PATH) as Secret,
        algorithm: JWT_ALGO as Algorithm,
        issuer: JWT_ISSUER_URLS,
        access: {
            ttl: JWT_ACCESS_TOKEN_TTL as StringValue,
        },
        refresh: {
            ttl: JWT_REFRESH_TOKEN_TTL as StringValue,
        },
        action: {
            ttl: JWT_ACTION_TOKEN_TTL as StringValue,
        },
    };
}

export const TOKEN_CFG = {};

//#region Methods
export function generateToken(
    type: 'access' | 'refresh' | 'action',
    payload: TokenPayload,
    options: TokenOptions,
): string {
    const tokenCfg = getTokenCfg();
    return sign({
        payload,
        privatekey: tokenCfg.privateKey,
        options: {
            algorithm: tokenCfg.algorithm,
            expiresIn: tokenCfg[type ?? 'access']?.ttl,
            issuer: tokenCfg.issuer,
            audience: options?.aud ?? '',
            subject: options?.sub ?? '',
            jwtid: crypto.randomUUID(),
        },
    });
}

export function verifyToken(
    type: 'access' | 'refresh' | 'action',
    token: string,
    options?: VerifyOptions,
): VerifyResult {
    const tokenCfg = getTokenCfg();
    return verify(token, {
        issuer: tokenCfg.issuer,
        maxAge: tokenCfg[type ?? 'access']?.ttl,
        ...(options ?? {}),
    });
}

function sign({ payload, privatekey, options }: TokenSignProps): string {
    return jwt.sign(payload, privatekey, options);
}

export function verify(token: string, options?: VerifyOptions): VerifyResult {
    try {
        const tokenCfg = getTokenCfg();
        const decoded = jwt.verify(token, tokenCfg.publicKey, {
            algorithms: [tokenCfg.algorithm],
            ...options,
        });

        if (typeof decoded === 'string') {
            return {
                success: false,
                error: {
                    name: 'InvalidPayload',
                    message: 'Payload expected as object, but got string',
                },
            };
        }

        return {
            success: true,
            payload: decoded as ModJwtPayload,
        };
    } catch (err: unknown) {
        let errorInfo = { name: 'UnknownError', message: 'Unknown verification error' };

        if (isErrorWithNameMessage(err)) {
            switch (err.name) {
                case 'TokenExpiredError':
                    errorInfo = { name: err.name, message: 'Token has expired' };
                    break;
                case 'JsonWebTokenError':
                    errorInfo = { name: err.name, message: 'Invalid token' };
                    break;
                case 'NotBeforeError':
                    errorInfo = { name: err.name, message: 'Token is not active yet' };
                    break;
                default:
                    errorInfo = {
                        name: err.name ?? 'UnknownError',
                        message: err.message ?? 'Unknown verification error',
                    };
            }
        }


        return {
            success: false,
            error: errorInfo,
        };
    }
}

function isErrorWithNameMessage(err: unknown): err is { name: string; message: string } {
    return typeof err === 'object' && err !== null && 'name' in err && 'message' in err;
}

export function generateRefreshToken() {
    return generateRandomHex();
}

export function parseBase64(base64: string) {
    return Buffer.from(base64, 'base64').toString('utf8');
}

export function decodeJwt<T = unknown>(token: string) {
    if (!token || typeof token !== 'string' || token.length == 0) return null;
    const [, payload] = token.split('.');

    if (!payload || payload.length == 0) return null;
    const json = parseBase64(payload);

    try {
        return JSON.parse(json) as T;
    } catch {
        return null;
    }
}

/**
 * Returns Unix timestamp (in seconds) for JWT.
 *
 * @param ttl string like "15m", "7d" or a number (in seconds)
 * @param from base time (Date.now()), defaults to current time
 * @returns Unix timestamp in seconds
 */
export function toJwtTimestamp(
    ttl: StringValue | number | null | undefined,
    from: number = Date.now(),
): number {
    if (ttl == null) {
        return Math.floor(from / 1000); // текущий момент
    }

    const ttlMs = typeof ttl === 'string' ? ms(ttl) : ttl * 1000;
    if (!ttlMs) throw new Error('Invalid TTL');

    return Math.floor((from + ttlMs) / 1000);
}

//#endregion
