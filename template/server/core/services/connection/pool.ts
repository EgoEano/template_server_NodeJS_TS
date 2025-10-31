import {createPoolFactory_PSQL} from './poolFactory_psql.js';
import type {PoolType} from './poolFactory_psql.js';
import { RedisManager } from './redisService.js';

const isDev = process.env.NODE_ENV === 'development';

let pool: PoolType;
let redisPool: RedisManager;
let redisLegacyPool: RedisManager;

export async function initConnections() {
    pool = createPoolFactory_PSQL();

    redisPool = new RedisManager({
        host: (isDev ? process.env.DEV_REDIS_CLIENT_HOST : process.env.REDIS_CLIENT_HOST) || 'localhost',
        port: Number(process.env.REDIS_CLIENT_PORT) || 6379,
    });
    await redisPool.connect();

    redisLegacyPool  = new RedisManager({
        host: (isDev ? process.env.DEV_REDIS_CLIENT_HOST : process.env.REDIS_CLIENT_HOST) || 'localhost',
        port: Number(process.env.REDIS_CLIENT_PORT) || 6379,
        options: {
            legacyMode: true,
        }
    });
    await redisLegacyPool.connect();
}

function getPools() {
    if (!pool || !redisPool || !redisLegacyPool) {
      throw new Error('Pools not initialized — call initConnections() first.');
    }
    return { pool, redisPool, redisLegacyPool };
}

export {pool, redisPool, redisLegacyPool, getPools};
