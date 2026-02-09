// core/redis/redisClient.js
import { createClient } from 'redis';
import Logger from '../../middleware/loggers/loggerService.js';

import type { RedisClientOptions } from 'redis';

type RedisManagerInitProps = {
    host: string;
    port?: number;
    password?: string | null | undefined;
    options?: RedisClientOptions;
};

type RedisSetOptions = {
    EX?: number;
    PX?: number;
    NX?: boolean;
    XX?: boolean;
    GET?: boolean;
};


export class RedisManager {
    client: ReturnType<typeof createClient>;
    private isConnecting = false;
    connectionSettings: RedisManagerInitProps;

    constructor({ 
        host, port = 6379, password, options 
    }: RedisManagerInitProps) {
        if (!host) throw new Error('[Redis] Host is required');

        this.connectionSettings = {
            host,
            port,
            password,
        };

        this.client = createClient({
            socket: { host, port },
            ...(password ? { password } : {}),
            ...(options ?? {}),
        });

        this.client.on('error', (err: unknown) => {
            Logger.error({
                message: '[Redis] Redis error',
                error: err,
                source: 'RedisManager.createClient',
            });
        });

        this.client.on('connect', () => {
            Logger.log({
                message: `[Redis] Connected to ${this.connectionSettings.host}:${this.connectionSettings.port}`,
                source: 'RedisManager',
            });
        });

        this.client.on('reconnecting', () => {
            Logger.warn({
                message: '[Redis] Reconnecting...',
                source: 'RedisManager',
            });
        });

        this.client.on('end', () => {
            Logger.warn({
                message: '[Redis] Connection closed',
                source: 'RedisManager.OnEnd',
            });
        });

        //TODO Сюда помещать нельзя - придумать как дропать коннект
        // process.on('SIGINT', async () => {
        //     await redis.disconnect();
        //     process.exit(0);
        // });    
    
    }

    async connect(): Promise<void> {
        if (this.client.isOpen || this.isConnecting) return;
        this.isConnecting = true;
        try {
            await this.client.connect();
        } finally {
            this.isConnecting = false;
        }
    }

    async disconnect() {
        if (this.client.isOpen) {
            await this.client.quit();
        }
    }

    // getClient() {
    //     return this.client;
    // }

    //#region Redis wrap Methods
    buildOptions(options?: RedisSetOptions) {
        if (!options) return undefined;

        const result: Record<string, number | true> = {};

        if (options.EX !== undefined) result.EX = options.EX;
        if (options.PX !== undefined) result.PX = options.PX;
        if (options.NX) result.NX = true;
        if (options.XX) result.XX = true;
        if (options.GET) result.GET = true;

        return Object.keys(result).length ? result : undefined;
    }    //#endregion
}
