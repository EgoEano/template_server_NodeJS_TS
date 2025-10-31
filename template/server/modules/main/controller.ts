import path from 'path';
import type { Request, Response } from 'express';
import MainService from './service.js';
import { createAndSendServerJsonResponseFromService } from '../../core/services/responses/typedResponses.js';

export default class MainController {
    mainService: MainService
    
    constructor() {
        this.mainService = new MainService();
    }
    
    async getIndex(req: Request, res: Response) {
        //res.sendFile(path.join(process.cwd(), 'public', 'index', 'index.html'));
        res.send("Messenger server is running");

    };

    async getDBTest(req: Request, res: Response) {
        const result = await this.mainService.getDBTest();
        createAndSendServerJsonResponseFromService(res, result);
    };

    async getHealthStatus(req: Request, res: Response) {
        res.status(200).json({ status: 'ok' });
    };

    async getFavicon(req: Request, res: Response) {
        res.status(204).end();
    };

    async getInfo(req: Request, res: Response) {
        const { code, msg } = req.query;
        res.status(200).json({ code, message: msg });
    };
}


