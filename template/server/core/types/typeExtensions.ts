import type { ModJwtPayload } from './tokenTypes';

// Express typed through global namespace
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
    namespace Express {
        interface Request {
            user?: ModJwtPayload | null | undefined;
        }
    }
}
/* eslint-enable @typescript-eslint/no-namespace */

export { };