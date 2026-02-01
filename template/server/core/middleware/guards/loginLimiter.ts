import { RateLimiterRedis } from 'rate-limiter-flexible';
import type { Request, Response, NextFunction } from 'express';

import Logger from '../loggers/loggerService.js';
import { redisLegacyPool } from '../../services/connection/pool.js';

interface LoginBody {
    login: string | number;
}

type RequestWithLogin = Request<
    Record<string, never>, // params
    Record<string, never>, // res body
    LoginBody               // req body
>;

const limiter = new RateLimiterRedis({
    storeClient: redisLegacyPool.getClient(),
    keyPrefix: 'login_fail',
    points: 5, // 5 attempts
    duration: 60 * 15, // 15 min
    blockDuration: 60 * 15, // 15 min
});

export async function loginLimiter(
    req: RequestWithLogin, res: Response, next: NextFunction
) {
    const { login } = req.body;
    if (!login) {
        Logger.warn({ message: 'Blocked request without login', source: 'loginLimiter' });
        return res.status(400).json({ message: 'login is not detected' });
    }

    try {
        await limiter.consume(login);
        next();
    } catch (err: unknown) {
        Logger.error({ message: 'Too many request', source: 'loginLimiter', error: err });
        res.status(429).json({ message: 'Too many request, please try later' });
    }
}

export async function deleteLimiter(
    req: RequestWithLogin
) {
    const { login } = req.body;
    if (login) {
        try {
            await limiter.delete(login);
        } catch (err: unknown) {
            Logger.error({ message: 'Error deleting limiter', source: 'loginLimiter', error: err });
        }
    } else {
        Logger.warn({ message: 'Blocked request without login', source: 'loginLimiter' });
    }
}
