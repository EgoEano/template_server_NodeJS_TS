import express from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { createAdapter as createSocketIORedisAdapter } from '@socket.io/redis-adapter';

import { initRoutesWhitelist } from './core/middleware/guards/routesWhitelist.js';
import { initGuards } from './core/middleware/guards/index.js';
import { startAllJobs } from './core/services/jobs/jobs.js';
import { initConnections } from './core/services/connection/pool.js';

//Routes import
import { usingRoutes } from './modules/entries.js';
import { RedisManager } from './core/services/connection/redisService.js';
import { SocketBusSingleton } from './core/services/connection/socketEventBusSingleton.js';
import { getEnv } from './core/services/utils/envWorker.js';

import type { Request, Response, ErrorRequestHandler } from 'express';

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason, promise);
    process.exit(1);
});

const app = express();

const {
    INNER_HOST,
    DEV_HOST,
    INNER_PORT,
    DEV_PORT,
    KEY_PEM_PATH,
    CERT_PEM_PATH,
    NODE_ENV,
    DEV_REDIS_CLIENT_HOST,
    REDIS_CLIENT_HOST,
    REDIS_CLIENT_PORT,
    SOCKETIO_CORS_ORIGIN,
    SOCKETIO_CORS_METHODS,
} = getEnv();

const isDev = NODE_ENV === 'development';

const REDIS_HOST = isDev ? DEV_REDIS_CLIENT_HOST : REDIS_CLIENT_HOST;

if (!REDIS_HOST) {
    throw new Error('Missing Redis host configuration');
}

// Request Logger - sometimes needed in debug
// app.use((req, res, next) => {
//     console.log("URL:", req.originalUrl);
//     console.log("Query:", req.query);
//     next();
// });

app.use(express.urlencoded({ extended: true }));
app.use(compression()); // requests compression
app.use(cookieParser()); // parsing cookies into JSON
app.use(express.static(path.join(process.cwd(), 'public'))); // Sharing public folder as static

initGuards(app);

initRoutesWhitelist({
    app: app,
    admittedRoutes: usingRoutes,
}); // Routes whitelist

// Initialize pools
await initConnections();

// Routes input from usingRoutes
usingRoutes.forEach((r) => app.use(r.path, r.route.router));

// Errors interception
app.use((err: ErrorRequestHandler, _: Request, res: Response) => {
    console.error('Server error:', err);

    if (err instanceof SyntaxError) {
        return res.status(400).send({ error: 'Bad request' });
    }
    if (err.name === 'ValidationError') {
        return res.status(422).send({ error: 'Validation failed' });
    }
    res.status(500).send({ error: 'Internal Server Error' });
});

startAllJobs();

const workHost: string = (isDev ? DEV_HOST : INNER_HOST) || 'localhost';
const workPort: number = (isDev ? DEV_PORT : INNER_PORT) || 12354;

let server;
const isHTTPS = false;
if (isHTTPS) {
    const options = {
        key: fs.readFileSync(KEY_PEM_PATH),
        cert: fs.readFileSync(CERT_PEM_PATH),
    };
    server = https.createServer(options, app);
} else {
    server = http.createServer(app);
}

// Create Redis connection
const redisConnectionConfig = {
    host: REDIS_HOST,
    port: REDIS_CLIENT_PORT,
};
const redis_pubClient = new RedisManager(redisConnectionConfig);
const redis_subClient = new RedisManager(redisConnectionConfig);
await redis_pubClient.connect();
await redis_subClient.connect();

// Socket IO
const ioRedisAdapter = createSocketIORedisAdapter(
    redis_pubClient.getClient(),
    redis_subClient.getClient(),
);

// Use environment variable for allowed CORS origin, fallback to '*'
SocketBusSingleton.init({
    server,
    adapter: ioRedisAdapter,
    options: {
        cors: {
            origin: SOCKETIO_CORS_ORIGIN,
            methods: SOCKETIO_CORS_METHODS,
        },
    },
});

// Finish init
server.listen(workPort, workHost, () => {
    console.log(`Server is running on https://${workHost}:${workPort}`);
    console.log('Listening on:', server.address());
});
