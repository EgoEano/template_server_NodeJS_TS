import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { rawBodySaverForExpressJs } from './helpers.js';
import { applyRateLimiter } from './rateLimiter.js';
import { setAllowedOrigins, setBlockedMethods } from './originsControl.js';
import { userAgentBlackList, userAgentWhiteList } from './agentGuard.js';
import { extensionGuard } from './extensionGuard.js';
import { getEnv } from '../../services/utils/envWorker.js';

import type { Express } from 'express';

export function initGuards(app: Express) {
    const { OUTER_PORT, ALLOWED_ORIGINS } = getEnv();

    app.use(express.json({ verify: rawBodySaverForExpressJs }));
    app.use(morgan('combined')); // requests logging
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"], // local only
                    scriptSrc: ["'self'"], // local and trusted only
                    frameSrc: ["'self'"],
                },
            },
        }),
    );
    app.use(helmet.frameguard({ action: 'deny' })); // Denying attachment for page in iframe
    applyRateLimiter(app); // limiter for DDoS preventing
    setAllowedOrigins({
        app: app,
        basicPort: OUTER_PORT,
        additionalOrigins: ALLOWED_ORIGINS,
    }); // Allowed Origins
    setBlockedMethods(app); // Blocking bot's methods

    // Use only one. As usually - userAgentBlackList for web, userAgentWhiteList - for applications
    userAgentBlackList(app); // Blocking setted suspicious agents
    //userAgentWhiteList(app); // Accepting only target agents

    extensionGuard(app); // Blocking extensions searching
}
