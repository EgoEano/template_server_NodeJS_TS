import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import slowDown from 'express-slow-down';
import type { Express, Request, Response } from 'express';

export function applyRateLimiter(app: Express) {
    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000, // 15 min
            max: 100,
            legacyHeaders: false,
            keyGenerator: (req: Request, res: Response): string => {
                return ipKeyGenerator(req?.ip ?? '');
            },
        }),
    );

    app.use(
        slowDown({
            windowMs: 60 * 1000,
            delayAfter: 10,
            delayMs: (used: number, req: Request, res: Response): number => {
                const slowDownInfo = (req as Request & { slowDown?: { limit: number } }).slowDown;
                const delayAfter = slowDownInfo?.limit ?? 10;
                return (used - delayAfter) * 1000;
            },
        }),
    );
}
