import express from 'express';
import MainController from './controller.js';
import type { Request, Response, NextFunction, Router } from 'express';
import type { Route } from '../../core/types/types.js';


const router: Router = express.Router();
const mainController = new MainController();

const routes: Route[] = [
    { method: 'get',  path: '/',  middleware: [], controller: (req: Request, res: Response) => mainController.getIndex(req, res) },
    { method: 'get', path: '/health', middleware: [], controller: (req: Request, res: Response) => mainController.getHealthStatus(req, res) },
    { method: 'get', path: '/healthcheck', middleware: [], controller: (req: Request, res: Response) => mainController.getHealthStatus(req, res) },
    { method: 'get', path: '/favicon.ico', middleware: [], controller: (req: Request, res: Response) => mainController.getFavicon(req, res) },
    { method: 'get', path: '/favicon.png', middleware: [], controller: (req: Request, res: Response) => mainController.getFavicon(req, res) },
    { method: 'get', path: '/info', middleware: [], controller: (req: Request, res: Response) => mainController.getInfo(req, res) },
    { method: 'get', path: /.*/, middleware: [], controller: (req: Request, res: Response) => res.status(404).send('Not Found') },
    { method: 'post', path: /.*/, middleware: [], controller: (req: Request, res: Response) => res.json({ error: "Error 404! Not Found!" }) },
];

routes.forEach(route => router[route.method](route.path, ...route.middleware, route.controller));

export default { router, routes };