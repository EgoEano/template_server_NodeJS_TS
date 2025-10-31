// core/redis/redisClient.js
import { createClient } from 'redis';
import * as connectRedis from 'connect-redis';
import Logger from '../../middleware/loggers/loggerService.js';

import type { RedisClientOptions } from 'redis';


type RedisManagerInitProps = {
    host: string;
    port: number;
    password?: string | null | undefined;
    options?: Partial<RedisClientOptions> & Record<string, unknown>;
}

type RedisSetOptions = {
    EX?: number;
    NX?: boolean;
    XX?: boolean;
    GET?: boolean;
};

export interface RedisResult<T = any> {
    success: boolean;
    result?: T;
    error?: any;
}

export class RedisManager {
    client: ReturnType<typeof createClient>;
    connectionSettings: RedisManagerInitProps;

    constructor({ host, port, password, options }: RedisManagerInitProps) {
        if (!host) throw new Error('[Redis] Host is required!');

        this.connectionSettings = { 
            host, 
            port: port || 6379, 
            password,
        };

        this.client = createClient({
            socket: { 
                host: this.connectionSettings.host, 
                port: this.connectionSettings.port 
            },
            ...(password ? { password } : {}),
            ...(options ?? {}),
        });
          
        this.client.on("error", (err: any) => {
            Logger.error({ 
                message: "[Redis] Redis error", 
                error: err,
                source: '[Redis] Create client'
            });
            process.exit(1);
        });
        
        this.client.on("end", () => {
            Logger.warn({ 
                message: "[Redis] Connection closed",
                source: 'RedisManager. On End'
            });
        });
          
    }

    async connect() {
        if (this.client.isOpen) return;
        try {
            await this.client.connect();
            console.log(`[Redis] Connected to ${this.connectionSettings.host}:${this.connectionSettings.port }`);
        } catch (err) {
            Logger.error({ 
                message: '[Redis] Connection error', 
                error: err,
                source: 'RedisManager.connect',
            });
            throw err;
        }
    }

    async disconnect() {
        if (this.client.isOpen) {
            await this.client.quit();
            console.log(`[Redis] Disconnected`);
        }
    }

    getClient() {
         return this.client;
    }

    async createStore(ttl: number) {
        if (typeof ttl !== 'number')throw new Error('[Redis] TTL must be a number (in seconds)');

        if (!this.client.isOpen) await this.connect();

        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });

        return new connectRedis.RedisStore({ client: this.client, ttl });
    }

    //#region Redis wrap Methods
    async set(
        key: string, 
        value: string, 
        options: RedisSetOptions = {}
    ): Promise<RedisResult<string | null>> {
        try {
            const redisOptions: Record<string, any> = {
                ...(options.EX ? { EX: options.EX } : {}),
                ...(options.NX ? { NX: true } : {}),
                ...(options.XX ? { XX: true } : {}),
                ...(options.GET ? { GET: true } : {}),
            };            
            const res = await this.client.set(key, value, redisOptions);
            return {
                success: (redisOptions.GET) ? (res !== null) : res === "OK",
                result: res,
            };
        } catch (err: any) {
            return {success: false, error: err};
        }
    }

    async get(key: string): Promise<RedisResult<string | null>> {
        try {
            const res = await this.client.get(key);
            return { success: res !== null, result: res };
        } catch (err: any) {
            return { success: false, error: err };
        }
    }

    async del(key: string | string[]): Promise<RedisResult<number>> {
        try {
            const res = await this.client.del(key);
            return { success: res > 0, result: res };
        } catch (err: any) {
            return { success: false, error: err };
        }
    }

    async sAdd(key: string, ...values: string[]): Promise<RedisResult<number>> {
        try {
            const res = await this.client.sAdd(key, values);
            return { success: res > 0, result: res };
        } catch (err: any) {
            return { success: false, error: err };
        }
    }

    // sRem
    async sRem(key: string, ...values: string[]): Promise<RedisResult<number>> {
        try {
            const res = await this.client.sRem(key, values);
            return { success: res > 0, result: res }; // >0 значит реально удалили
        } catch (err: any) {
            return { success: false, error: err };
        }
    }

    async sMembers(key: string): Promise<RedisResult<string[]>> {
        try {
            const res = await this.client.sMembers(key);
            return { success: true, result: res };
        } catch (err: any) {
            return { success: false, result: [], error: err };
        }
    }

    async sIsMember(key: string, member: string): Promise<RedisResult<boolean>> {
        try {
            const res = await this.client.sIsMember(key, member);
            return { success: true, result: res === 1 };
        } catch (err: any) {
            return { success: false, result: false, error: err };
        }
    }
    
    multi(): ReturnType<typeof this.client.multi> {
        return this.client.multi();
    }

    async watch(key: string): Promise<RedisResult<"OK" | "ERROR">> {
        try {
            const res = await this.client.watch(key);
            return { success: true, result: res };
        } catch (err: any) {
            return { success: false, result: "ERROR", error: err };
        }
    }

    async unwatch(): Promise<RedisResult<"OK" | "ERROR">> {
        try {
            const res = await this.client.unwatch();
            return { success: true, result: res };
        } catch (err: any) {
            return { success: false, result: "ERROR", error: err };
        }
    }

    // exists
    async exists(...keys: string[]): Promise<RedisResult<number>> {
        try {
            const res = await this.client.exists(keys);
            return { success: res > 0, result: res }; // >0 значит какие-то ключи существуют
        } catch (err: any) {
            return { success: false, error: err };
        }
    }

    // expire
    async expire(key: string, seconds: number): Promise<RedisResult<number>> {
        try {
            const res = await this.client.expire(key, seconds);
            return { success: res === 1, result: res }; // 1 = ttl поставлен
        } catch (err: any) {
            return { success: false, error: err };
        }
    }
    //#endregion
}


