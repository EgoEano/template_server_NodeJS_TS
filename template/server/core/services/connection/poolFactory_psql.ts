import pkg from 'pg';
import { getEnv } from '../utils/envWorker.js';

type ConnectionConfig = {
    user: string;
    host: string;
    database: string;
    password: string;
    port: number;
    [key: string]: any; // For overrides support
};

export interface PoolType extends pkg.Pool {}

export async function createPoolFactory_PSQL(
    overrides: Partial<ConnectionConfig> = {},
): Promise<PoolType> {
    const { NODE_ENV, DB_USER, DB_HOST, DEV_DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT } = getEnv();
    const isDev = NODE_ENV === 'development';

    const connectionConfig: ConnectionConfig = {
        user: DB_USER,
        host: isDev ? DEV_DB_HOST : DB_HOST,
        database: DB_NAME,
        password: DB_PASSWORD,
        port: Number(DB_PORT) || 5432,
        ...overrides,
    };

    let pool: PoolType;
    try {
        pool = new pkg.Pool(connectionConfig);
    } catch (error) {
        throw new Error('Database connection failed');
    }

    const isPoolCreated = await checkPool(pool);
    if (!isPoolCreated) {
        throw new Error('Database connection failed');
    }
    console.log('PSQL pool is created');
    return pool;
}

async function checkPool(pool: PoolType): Promise<boolean> {
    const res = await pool?.query('select 1');
    if (res.rows.length === 0) {
        return false;
    }
    return true;
}
