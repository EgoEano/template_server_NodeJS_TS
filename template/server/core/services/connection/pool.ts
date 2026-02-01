import { createPoolFactory_PSQL } from './poolFactory_psql.js';
import type { PoolType } from './poolFactory_psql.js';
import { RedisManager } from './redisService.js';
import { getEnv } from '../utils/envWorker.js';
import { parseErrorMessage } from '../utils/parsers.js';

let pool: PoolType;
let redisPool: RedisManager;
let redisLegacyPool: RedisManager;

export async function initConnections() {
    const { NODE_ENV, DEV_REDIS_CLIENT_HOST, REDIS_CLIENT_HOST, REDIS_CLIENT_PORT } = getEnv();
    const isDev = NODE_ENV === 'development';
    try {
        pool = await createPoolFactory_PSQL();

        redisPool = new RedisManager({
            host: isDev ? DEV_REDIS_CLIENT_HOST : REDIS_CLIENT_HOST,
            port: REDIS_CLIENT_PORT,
        });
        await redisPool.connect();

        redisLegacyPool = new RedisManager({
            host: isDev ? DEV_REDIS_CLIENT_HOST : REDIS_CLIENT_HOST,
            port: REDIS_CLIENT_PORT,
            options: {
                legacyMode: true,
            },
        });
        await redisLegacyPool.connect();
    } catch (error) {
        throw new Error(`Database connection failed: ${parseErrorMessage(error)}`);
    }
}

function getPools() {
    if (!pool || !redisPool || !redisLegacyPool) {
        throw new Error('Pools not initialized — call initConnections() first.');
    }
    return { pool, redisPool, redisLegacyPool };
}

export { pool, redisPool, redisLegacyPool, getPools };
