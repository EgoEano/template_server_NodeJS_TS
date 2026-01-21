import dotenv from 'dotenv';
dotenv.config();

// config/env.ts
type Env = {
    NODE_ENV: 'development' | 'production' | 'test';

    // Server Configuration
    INNER_HOST: string;
    DEV_HOST: string;
    INNER_PORT: number;
    DEV_PORT: number;
    OUTER_PORT: number;

    // Agent Guard
    USER_AGENT_NAME: string;
    USER_AGENT_VERSION: string;

    // Security / SSL
    KEY_PEM_PATH: string;
    CERT_PEM_PATH: string;
    ALLOWED_ORIGINS: string[];

    // Redis
    DEV_REDIS_CLIENT_HOST: string;
    REDIS_CLIENT_HOST: string;
    REDIS_CLIENT_PORT: number;

    // Database
    DB_HOST: string;
    DEV_DB_HOST: string;
    DB_PORT: number;
    DB_USER: string;
    DB_NAME: string;
    DB_PASSWORD: string;

    // Socket.IO
    SOCKETIO_CORS_ORIGIN: string;
    SOCKETIO_CORS_METHODS: string[];

    // JWT
    JWT_PRIVATE_KEY_PATH: string;
    JWT_PUBLIC_KEY_PATH: string;
    JWT_ALGO: string;
    JWT_ISSUER_URLS: string;
    JWT_ACCESS_TOKEN_TTL: string;
    JWT_REFRESH_TOKEN_TTL: string;
    JWT_ACTION_TOKEN_TTL: string;
};

export function getEnv(): Env {
    const {
        NODE_ENV,
        INNER_HOST,
        DEV_HOST,
        INNER_PORT,
        DEV_PORT,
        OUTER_PORT,
        USER_AGENT_NAME,
        USER_AGENT_VERSION,
        KEY_PEM_PATH,
        CERT_PEM_PATH,
        ALLOWED_ORIGINS,
        DEV_REDIS_CLIENT_HOST,
        REDIS_CLIENT_HOST,
        REDIS_CLIENT_PORT,
        DB_HOST,
        DEV_DB_HOST,
        DB_PORT,
        DB_USER,
        DB_NAME,
        DB_PASSWORD,
        SOCKETIO_CORS_ORIGIN,
        SOCKETIO_CORS_METHODS,
        JWT_PRIVATE_KEY_PATH,
        JWT_PUBLIC_KEY_PATH,
        JWT_ALGO,
        JWT_ISSUER_URLS,
        JWT_ACCESS_TOKEN_TTL,
        JWT_REFRESH_TOKEN_TTL,
        JWT_ACTION_TOKEN_TTL,
    } = process.env;

    if (!NODE_ENV) throw new Error('NODE_ENV env variable is required');
    if (!INNER_HOST || !DEV_HOST) {
        throw new Error('You have to set host addresses in env file!');
    }
    if (!KEY_PEM_PATH || !CERT_PEM_PATH) {
        throw new Error('SSL key or cert path is not defined in environment variables');
    }
    if (!DB_HOST || !DB_PORT || !DB_USER || !DB_NAME || !DB_PASSWORD) {
        throw new Error('Database environment variables are not set.');
    }
    if (!JWT_PRIVATE_KEY_PATH || !JWT_PUBLIC_KEY_PATH) {
        throw new Error('Need to set path to JWT keys');
    }

    return {
        NODE_ENV: NODE_ENV as Env['NODE_ENV'],
        INNER_HOST,
        DEV_HOST,
        INNER_PORT: INNER_PORT ? parseInt(INNER_PORT, 10) : 3000,
        DEV_PORT: DEV_PORT ? parseInt(DEV_PORT, 10) : 3000,
        OUTER_PORT: OUTER_PORT ? parseInt(OUTER_PORT, 10) : 3000,
        USER_AGENT_NAME: USER_AGENT_NAME || '',
        USER_AGENT_VERSION: USER_AGENT_VERSION || '1.0.0',
        KEY_PEM_PATH,
        CERT_PEM_PATH,
        ALLOWED_ORIGINS: ALLOWED_ORIGINS ? ALLOWED_ORIGINS.split(',') : [],
        DEV_REDIS_CLIENT_HOST: DEV_REDIS_CLIENT_HOST || '127.0.0.1',
        REDIS_CLIENT_HOST: REDIS_CLIENT_HOST || 'redis',
        REDIS_CLIENT_PORT: REDIS_CLIENT_PORT ? parseInt(REDIS_CLIENT_PORT, 10) : 6379,
        DB_HOST,
        DEV_DB_HOST: DEV_DB_HOST || 'localhost',
        DB_PORT: DB_PORT ? parseInt(DB_PORT, 10) : 5432,
        DB_USER,
        DB_NAME,
        DB_PASSWORD,
        SOCKETIO_CORS_ORIGIN: SOCKETIO_CORS_ORIGIN || '*',
        SOCKETIO_CORS_METHODS: SOCKETIO_CORS_METHODS
            ? SOCKETIO_CORS_METHODS.split(',')
            : ['GET', 'POST'],
        JWT_PRIVATE_KEY_PATH,
        JWT_PUBLIC_KEY_PATH,
        JWT_ALGO: JWT_ALGO || 'RS256',
        JWT_ISSUER_URLS: JWT_ISSUER_URLS || '',
        JWT_ACCESS_TOKEN_TTL: JWT_ACCESS_TOKEN_TTL || '5m',
        JWT_REFRESH_TOKEN_TTL: JWT_REFRESH_TOKEN_TTL || '10d',
        JWT_ACTION_TOKEN_TTL: JWT_ACTION_TOKEN_TTL || '1m',
    };
}
