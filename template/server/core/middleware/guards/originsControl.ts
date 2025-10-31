import cors from 'cors';
import type { Express, Request, Response, NextFunction } from 'express';
import Logger from '../loggers/loggerService.js';


interface AllowedOriginsOptions {
    app: Express;
    basicPort: number | string;
    additionalOrigins?: string[];
}


const allowedMethods= ['GET', 'POST', 'PUT', 'PATCH ', 'DELETE'];
const blockedMethods = ['PROPFIND', 'TRACE', 'OPTIONS'];
const allowedHeaders = ['Content-Type', 'Authorization'];

export function setAllowedOrigins({app, basicPort, additionalOrigins = []}: AllowedOriginsOptions) {
    const defaultOrigins = [
        `http://localhost`,
        `http://localhost:${basicPort}`,
        `https://localhost`,
        `https://localhost:${basicPort}`,
        `http://0.0.0.0`,
        `https://0.0.0.0`,
        `http://0.0.0.0:${basicPort}`,
        `https://0.0.0.0:${basicPort}`,
    ];

    const allowedOrigins = [...defaultOrigins, ...additionalOrigins];

    app.use(cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: allowedMethods,
      allowedHeaders: allowedHeaders
    }));
}

export function setBlockedMethods(app: Express): void {
    app.use((req: Request, res: Response, next: NextFunction) => {
    if (blockedMethods.includes(req.method.toUpperCase())) {
        Logger.warn({
          message: `Blocked method. ip: ${req.ip}, method: ${req.method}, path: ${req.originalUrl}`, 
          source: 'setBlockedMethods'

        });
        return res.status(405).send('Method Not Allowed');
    }
    next();
    });

}
