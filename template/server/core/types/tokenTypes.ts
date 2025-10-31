import type { 
    Secret, 
    Algorithm, 
	JwtPayload
} from "jsonwebtoken";
import type { StringValue } from "ms";


export type SessionData = {
	user_id: string;
	device_id: string;
	device_hash: string;
	refresh_token: string;
	created_at: number;
	expires_at: number;
	mastery: boolean;
	used: boolean;
};

export type SessionDataClient = SessionData & {
	session_id: string,
	access_token: string;
};

export interface TokenSignProps {
    payload: TokenPayload | TokenActionPayload;
    privatekey: Secret;
    options: SignOptions;
}

export interface TokenPayload extends JwtPayload {
    roles: string[];  // роли выданные держателю токена
    scope?: string;  // права выданные держателю токена
    
    device_id?: string;  // для привязки к устройству
    device_hash?: string;  // хэш устройства, формируемый из технических данных
    session_id?: string;  // для контроля/отзыва

    version: number; // версионирование токенов
}

export interface TokenActionPayload extends TokenPayload {
    action_type: string;
    params_hash: string;    // хэш параметров действия
  }

export type ModJwtPayload = TokenPayload | TokenActionPayload;

export interface TokenOptions {
    iss?: string;  // Issuer service
    aud?: string;  // аудитория (например: api, mobile, web)
    sub: string;  // userId
}

export interface SignOptions {
    algorithm: Algorithm,
    expiresIn: StringValue,
    issuer?: string,
    audience?: string,
    subject?: string,
    jwtid?: string
};

export interface VerifyOptions {
    issuer?: string | [string, ...(string[])] | undefined;
    audience?: string | RegExp | [string | RegExp, ...(string | RegExp)[]] | undefined;
    subject?: string | undefined;
    jwtid?: string | undefined;
    clockTolerance?: number | undefined;
    maxAge?: string | number | undefined;
}

export interface VerifyResult {
    success: boolean;
    error?: {
        name: string;
        message: string;
    };
    payload?: ModJwtPayload;
}

export type UserEntity = {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    is_submitted: boolean;
    last_login: Date | null;
    created_at: Date;
};

