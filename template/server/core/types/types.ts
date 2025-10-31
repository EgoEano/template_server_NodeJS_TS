import type { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import { Router } from 'express';


export type HTTPMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options';

export type RoutesWhitelistOptions = {
    app: Express,
    admittedRoutes: RouteGroup[]
};

export type RouteGroup = {
    path: string;
    route: RouterType;
};

export type RouterType = {
    router: Router, 
    routes: Route[]
};

export type Route = {
    method: HTTPMethod, 
    path: string | RegExp, 
    middleware: RequestHandler[], 
    controller: (req: Request, res: Response, next?: NextFunction) => any; 
};

export type AllowedRoute = {
    path: string, 
    method: string, 
}
