import path from 'path';
import type { Express, Request, Response, NextFunction } from 'express';

import Logger from '../loggers/loggerService.js';

const forbiddenExtensions = [
    '.env',
    '.ini',
    '.bak',
    '.log',
    '.git',
    '.sql',
    '.tar',
    '.gz',
    '.zip',
    '.json',
    '.ts',
    '.cgi',
];

export function extensionGuard(app: Express) {
    app.use((req: Request, res: Response, next: NextFunction) => {
        try {
            const rawUrl: string = req?.url ?? '';
            if (!rawUrl) {
                Logger.warn({
                    message: `Blocked empty URL, ip: ${req.ip}`,
                    source: 'extensionGuard',
                });
                return res.status(400).send('Bad Request');
            }

            const rawPath = decodeURIComponent((rawUrl.split('?')[0] ?? '').split('#')[0] ?? '');
            const normalized = path.normalize(rawPath).toLowerCase();

            if (forbiddenExtensions.some((ext) => normalized.endsWith(ext))) {
                Logger.warn({
                    message: `Blocked extension request. ip: ${req.ip}`,
                    source: 'extensionGuard',
                });
                return res.status(403).send('Forbidden');
            }
            next();
        } catch (e: any) {
            Logger.error({
                message: `extensionGuard error: ${e.message}`,
                source: 'extensionGuard',
            });
            return res.status(400).send('Bad Request');
        }
    });
}
