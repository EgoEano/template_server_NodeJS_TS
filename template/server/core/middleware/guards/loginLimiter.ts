import { RateLimiterRedis } from 'rate-limiter-flexible';
import type { Request, Response, NextFunction } from 'express';

import Logger from '../loggers/loggerService.js';
import { redisLegacyPool } from '../../services/connection/pool.js';

const limiter = new RateLimiterRedis({
    storeClient: redisLegacyPool.getClient(),
    keyPrefix: 'login_fail',
    points: 5, // 5 attempts
    duration: 60 * 15, // 15 min
    blockDuration: 60 * 15, // 15 min
});

export async function loginLimiter(req: Request, res: Response, next: NextFunction) {
    const { login } = req.body;
    if (!login) {
        Logger.warn({ message: 'Blocked request without login', source: 'loginLimiter' });
        return res.status(400).json({ message: 'login is not detected' });
    }

    try {
        await limiter.consume(login);
        next();
    } catch (err: any) {
        console.log(err);
        

        res.status(429).json({ message: 'Too many request, please try later' });
    }
}

export async function deleteLimiter(req: Request) {
    const { login } = req.body;

    if (login) {
        limiter.delete(login)
    } else {
        Logger.warn({ message: 'Blocked request without login', source: 'loginLimiter' });
    }
}