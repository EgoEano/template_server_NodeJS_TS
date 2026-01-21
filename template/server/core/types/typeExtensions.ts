import type { ModJwtPayload } from './tokenTypes';

declare global {
    namespace Express {
        interface Request {
            user?: ModJwtPayload | null | undefined;
        }
    }
}
