import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from 'dotenv';
import fs from 'fs';
import ms from "ms";

import { generateRandomHex } from "./generators.js";

import type { StringValue } from "ms";
import type { 
    Secret, 
    Algorithm, 
} from "jsonwebtoken";
import type {
    TokenSignProps,
    TokenPayload,
    TokenOptions,
    TokenActionPayload,
    SignOptions,
    VerifyOptions,
    VerifyResult,
    ModJwtPayload,
    UserEntity
} from "../../types/tokenTypes";


if (!process.env.JWT_PRIVATE_KEY_PATH || !process.env.JWT_PUBLIC_KEY_PATH) {
    throw new Error('Need to set path to JWT keys');
}

export const TOKEN_CFG = {
    privateKey: (fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH)) as Secret,
    publicKey: (fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH)) as Secret,
    algorithm: (process.env.JWT_ALGO ?? "RS256") as Algorithm,
    issuer: (process.env.JWT_ISSUER_URLS ?? '') as string,

    access: {
        ttl: (process.env?.JWT_ACCESS_TOKEN_TTL ?? "5m") as StringValue,
    },
    refresh: {
        ttl: (process.env?.JWT_REFRESH_TOKEN_TTL ?? "10d") as StringValue,
    },
    action: {
        ttl: (process.env?.JWT_ACTION_TOKEN_TTL ?? "1m") as StringValue,
    }
};

//#region Methods
export function generateToken(
    type: 'access' | 'refresh' | 'action',
    payload: TokenPayload, 
    options: TokenOptions
): string {
    return sign({
        payload,
        privatekey: TOKEN_CFG.privateKey,
        options: {
            algorithm: TOKEN_CFG.algorithm,
            expiresIn: TOKEN_CFG[type ?? 'access']?.ttl,
            issuer: TOKEN_CFG.issuer,
            audience: options?.aud ?? '',
            subject: options?.sub ?? '',
            jwtid: crypto.randomUUID()
        }
    });
}

export function verifyToken(
    type: 'access' | 'refresh' | 'action',
    token: string, 
    options?: VerifyOptions
): VerifyResult {
    return verify(
        token,
        {
            issuer: TOKEN_CFG.issuer,
            maxAge: TOKEN_CFG[type ?? 'access']?.ttl,
            ...(options ?? {}),
        }
    );
}

function sign({
    payload, 
    privatekey, 
    options
}: TokenSignProps): string {
    return jwt.sign(
        payload,
        privatekey,
        options
    );
}

export function verify(
    token: string, 
    options?: VerifyOptions
): VerifyResult {
    try {
        const decoded = jwt.verify(
            token, 
            TOKEN_CFG.publicKey, 
            {
                algorithms: [TOKEN_CFG.algorithm],
                ...options
            }
        );

        if (typeof decoded === "string") {
            return {
                success: false,
                error: { name: "InvalidPayload", message: "Payload expected as object, but got string" }
            };
        }

        return {
            success: true,
            payload: decoded as ModJwtPayload,
        }; 
    } catch (err: any) {
        let errorInfo = { name: "", message: "" };

        switch (err.name) {
            case "TokenExpiredError":
                errorInfo = { name: err.name, message: "Token has expired" };
                break;
            case "JsonWebTokenError":
                errorInfo = { name: err.name, message: "Invalid token" };
                break;
            case "NotBeforeError":
                errorInfo = { name: err.name, message: "Token is not active yet" };
                break;
            default:
                errorInfo = { 
                    name: err.name ?? "UnknownError", 
                    message: err.message ?? "Unknown verification error" 
                };
        }

        return {
            success: false,
            error: errorInfo,
        };
    }
}

export function generateRefreshToken() {
    return generateRandomHex(); 
}

export function parseBase64(base64: string) {
    return Buffer.from(base64, "base64").toString("utf8");
}

export function decodeJwt(token: string) {
    if (!token || typeof token !== "string" || token.length == 0) return null;
    const [, payload] = token.split(".");
    
    if (!payload || payload.length == 0) return null;
    const json = parseBase64(payload);
    return JSON.parse(json);
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
    from: number = Date.now()
): number {
    if (ttl == null) {
        return Math.floor(from / 1000); // текущий момент
    }

    const ttlMs = typeof ttl === "string" ? ms(ttl) : ttl * 1000;
    if (!ttlMs) throw new Error("Invalid TTL");

    return Math.floor((from + ttlMs) / 1000);
}

//#endregion