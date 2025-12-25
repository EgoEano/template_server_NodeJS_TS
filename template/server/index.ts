import express from "express";
import type { Request, Response, NextFunction } from 'express';
import http from "http";
import https from 'https';
import fs from 'fs';
import { createAdapter as createSocketIORedisAdapter } from "@socket.io/redis-adapter";
import dotenv from 'dotenv';
import {fileURLToPath} from 'url';
import path from 'path';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';

import {rawBodySaverForExpressJs} from './core/middleware/guards/helpers.js';
import {applyRateLimiter} from './core/middleware/guards/rateLimiter.js';
import {setAllowedOrigins, setBlockedMethods} from './core/middleware/guards/originsControl.js';
import {userAgentBlackList, userAgentWhiteList} from './core/middleware/guards/agentGuard.js';
import {extensionGuard} from './core/middleware/guards/extensionGuard.js';
import {initRoutesWhitelist} from './core/middleware/guards/routesWhitelist.js';
import {startAllJobs} from './core/services/jobs/jobs.js';
import { initConnections } from "./core/services/connection/pool.js";
import Logger from "./core/middleware/loggers/loggerService.js";

//Routes import
import { usingRoutes } from "./modules/entries.js";
import { RedisManager } from "./core/services/connection/redisService.js";
import { SocketBusSingleton } from "./core/services/connection/socketEventBusSingleton.js";

process.on('uncaughtException', (err) => {
    Logger.error({
        message: `Uncaught Exception`, 
        error: err,
        source: 'server:uncaughtException'
    });
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    Logger.error({
        message: `Unhandled Rejection at: promise. Reason: ${reason}`, 
        error: [reason, promise],
        source: 'server:unhandledRejection'
    });
    process.exit(1);
});

const app = express();
dotenv.config();

const INNER_HOST = process.env.INNER_HOST;
const DEV_HOST = process.env.DEV_HOST;
const INNER_PORT = process.env.INNER_PORT;
const DEV_PORT = process.env.DEV_PORT;
const OUTER_PORT = process.env.OUTER_PORT || 3000;
const KEY_PEM_PATH = process.env.KEY_PEM_PATH;
const CERT_PEM_PATH = process.env.CERT_PEM_PATH;

const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

if (!INNER_HOST || !DEV_HOST) {
    throw new Error('You have to set host addresses in env file!');
}
if (!KEY_PEM_PATH || !CERT_PEM_PATH) {
    throw new Error('SSL key or cert path is not defined in environment variables');
}

const REDIS_HOST = isDev 
  ? process.env.DEV_REDIS_CLIENT_HOST 
  : process.env.REDIS_CLIENT_HOST;
const REDIS_PORT = parseInt(process.env.REDIS_CLIENT_PORT ?? '', 10) || 6379;

if (!REDIS_HOST) {
  throw new Error('Missing Redis host configuration');
}

// Request Logger - sometimes needed in debug
// app.use((req, res, next) => {
//     console.log("URL:", req.originalUrl);
//     console.log("Query:", req.query);
//     next();
// });

app.use(express.json({ verify: rawBodySaverForExpressJs }));
app.use(express.urlencoded({ extended: true }));
app.use(compression()); // requests compression
app.use(morgan('combined')); // requests logging
app.use(cookieParser()); // parsing cookies into JSON

// Guards
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"], // local only
            scriptSrc: ["'self'"], // local and trusted only
            frameSrc: ["'self'"],
        },
    },
})); 
app.use(helmet.frameguard({ action: 'deny' })); // Denying attachment for page in iframe
applyRateLimiter(app); // limiter for DDoS preventing
setAllowedOrigins({
    app: app, 
    basicPort: OUTER_PORT, 
    additionalOrigins: envOrigins,
}); // Allowed Origins
setBlockedMethods(app); // Blocking bot's methods

// Use only one. As usually - userAgentBlackList for web, userAgentWhiteList - for applications
userAgentBlackList(app); // Blocking setted suspicious agents
//userAgentWhiteList(app); // Accepting only target agents

extensionGuard(app); // Blocking extensions searching

app.use(express.static(path.join(process.cwd(), 'public'))); // Sharing public folder as static


initRoutesWhitelist({
    app: app,
    admittedRoutes: usingRoutes
}); // Routes whitelist

// Initialize pools
initConnections();

// Routes input from usingRoutes
usingRoutes.forEach(r => app.use(r.path, r.route.router));

// Errors interception
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    Logger.error({
        message: `Server error`, 
        error: err,
        source: 'server:app.use'
    });
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
const workPort: number = parseInt((isDev ? DEV_PORT : INNER_PORT) ?? '') || 12354;

const isHTTPS = false;
let server;
if (isHTTPS) {
    const options = {
        key: fs.readFileSync(KEY_PEM_PATH),
        cert: fs.readFileSync(CERT_PEM_PATH)
    };
    server = https.createServer(options, app);
} else {
    server = http.createServer(app);
}

// Create Redis connection
const redisConnectionConfig = {
    host: REDIS_HOST,
    port: REDIS_PORT,
};
const redis_pubClient = new RedisManager(redisConnectionConfig);
const redis_subClient = new RedisManager(redisConnectionConfig);
await redis_pubClient.connect();
await redis_subClient.connect();

// Socket IO
const ioRedisAdapter = createSocketIORedisAdapter(
    redis_pubClient.getClient(), 
    redis_subClient.getClient()
);

// Use environment variable for allowed CORS origin, fallback to '*'
const SOCKETIO_CORS_ORIGIN = process.env.SOCKETIO_CORS_ORIGIN || "*";
const SOCKETIO_CORS_METHODS = (process.env.SOCKETIO_CORS_METHODS || "GET,POST").split(',');

const socketIO_options = {
    cors: {
        origin: SOCKETIO_CORS_ORIGIN,
        methods: SOCKETIO_CORS_METHODS
    }
};
SocketBusSingleton.init({
    server, 
    adapter: ioRedisAdapter, 
    options: socketIO_options
});


// Finish init
server.listen(workPort, workHost, () => {
    console.log(`Server is running on https://${workHost}:${workPort}`);
    console.log('Listening on:', server.address());
});
