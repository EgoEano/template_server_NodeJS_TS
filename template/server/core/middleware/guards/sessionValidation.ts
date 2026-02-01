//import crypto from 'crypto';

import Logger from '../loggers/loggerService.js';
import { verifyToken } from '../../services/utils/tokenator.js';
import { redisPool } from '../../services/connection/pool.js';

import type { Request, Response, NextFunction } from 'express';
import type { ModJwtPayload } from '../../types/tokenTypes.js';

export async function validateSession(req: Request, res: Response, next: NextFunction) {
    const keyRedis_user_session: (user_id: string) => string = (user_id) =>
        `user:${user_id}:sessions`;

    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            Logger.warn({
                message: `No token provided`,
                source: 'validateSession',
            });
            return res.status(401).json({ success: false, error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token || !token.trim()) {
            Logger.warn({
                message: `Empty token provided`,
                source: 'validateSession',
            });
            return res.status(401).json({ success: false, error: 'Empty token provided' });
        }

        //#FIXME payload упрямо типизируется JwtPayload | undefined хотя явно указан тип (разобраться при рефакторе или забить к хуям и оставить приведение через as)
        const {
            success: verifyTokenSuccess,
            error: verifyTokenError,
            payload: verifyTokenPayload,
        } = verifyToken('access', token);

        //Добавить чек на success, error

        // Session checking
        const userID = (verifyTokenPayload as ModJwtPayload)?.sub;
        const sessID = (verifyTokenPayload as ModJwtPayload)?.session_id;

        let isSessionValid = false;

        if (verifyTokenSuccess && userID && userID.length > 0 && sessID && sessID.length > 0) {
            const call = await redisPool.sIsMember(keyRedis_user_session(userID), sessID);
            isSessionValid = call.success && !!call.result;
        }
        //#FIXME Добавить проверку данных устройства (перед этим разобраться как генерировать на клиенте)
        if (isSessionValid) {
            Object.defineProperty(req, 'user', {
                value: verifyTokenPayload,
                writable: true,
                configurable: true,
                enumerable: true,
            });
            next();
        } else {
            Logger.warn({
                message: `Invalid token. ${verifyTokenError?.name ?? ''} - ${verifyTokenError?.message ?? ''}`,
                source: 'validateSession',
            });
            return res.status(401).json({ success: false, error: 'Invalid or expired token' });
        }
    } catch (err) {
        Logger.error({
            message: 'Session validation error',
            error: err,
            source: 'validateSession',
        });
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

// export function dropSession(req: Request, res: Response, next: NextFunction) {
//     if (!req.session) return next();

//     try {
//         // drop cookie verifier
//         res.clearCookie('session_verifier', {
//             path: '/',
//             secure: true,
//             httpOnly: true,
//             sameSite: 'strict',
//         });

//         // drop session
//         req.session.destroy(err => {
//             if (err) {
//                 Logger.error({message: `Redis ending session error: ${err.message}`, error: err});
//             }
//         });
//         req.session = null;

//         next();

//     } catch (err) {
//         Logger.error({ message: 'DropSession error', error: err });
//         return res.status(500).json({ error: 'Internal error during session drop' });
//     }
// }
