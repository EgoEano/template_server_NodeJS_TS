import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

type ConnectionConfig = {
    user: string;
    host: string;
    database: string;
    password: string;
    port: number;
    [key: string]: any; // For overrides support
};

export interface PoolType extends pkg.Pool {
}

export function createPoolFactory_PSQL(overrides: Partial<ConnectionConfig> = {}): PoolType {
    if (!process.env.DB_USER || !process.env.DB_NAME || !process.env.DB_PASSWORD) {
        throw new Error("Database environment variables are not set.");
    }
    const isDev = process.env.NODE_ENV === 'development';

    const connectionConfig: ConnectionConfig = {
        user: process.env.DB_USER,
        host: (isDev ? process.env.DEV_DB_HOST : process.env.DB_HOST) || 'localhost',
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT) || 5432,
        ...overrides
    };
    const pool = new pkg.Pool(connectionConfig);
    console.log('PSQL pool is created');
    return pool;
}
