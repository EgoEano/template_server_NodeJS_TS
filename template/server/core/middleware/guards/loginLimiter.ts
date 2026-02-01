import { RateLimiterRedis } from 'rate-limiter-flexible';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

import Logger from '../loggers/loggerService.js';
import { redisLegacyPool } from '../../services/connection/pool.js';

interface LoginBody {
    login: string;
}

type RequestWithLogin = Request<
    Record<string, never>, // params
    Record<string, never>, // res body
    LoginBody               // req body
>;

type LoginRequest = Request<Record<string, string>, unknown, LoginBody>;

const limiter = new RateLimiterRedis({
    storeClient: redisLegacyPool.getClient(),
    keyPrefix: 'login_fail',
    points: 5, // 5 attempts
    duration: 60 * 15, // 15 min
    blockDuration: 60 * 15, // 15 min
});


export const loginLimiter: RequestHandler<
    Record<string, string>, // params
    unknown, // res body
    LoginBody // req body
> = async (
    req: LoginRequest,
    res: Response,
    next: NextFunction
) => {
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
            return res.status(429).json({ message: 'Too many request, please try later' });
        }
    };


export const deleteLimiter = async (
    req: RequestWithLogin
) => {
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
