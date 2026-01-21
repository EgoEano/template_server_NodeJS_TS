import type { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import type { Router } from 'express';

// Routes
export type HTTPMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options';

export type RoutesWhitelistOptions = {
    app: Express;
    admittedRoutes: RouteGroup[];
};

export type RouteGroup = {
    path: string;
    route: RouterType;
};

export type RouterType = {
    router: Router;
    routes: Route[];
};

export type Route = {
    method: HTTPMethod;
    path: string | RegExp;
    middleware: RequestHandler[];
    controller: (req: Request, res: Response, next?: NextFunction) => any;
};

export type AllowedRoute = {
    path: string;
    method: string;
};

// Logger
export type LogParams = {
    message: string;
    source: string | null;
    isWriteDB?: boolean;
};

export type ErrorParams = {
    message: string;
    source: string | null;
    error?: unknown;
    isWriteDB?: boolean;
};

export type WriterParams = {
    levelKey: string;
    message: string;
    error?: unknown;
    source: string | null;
};

export type NormalizedError = {
    type: string;
    message: string;
    stack: string[];
};
