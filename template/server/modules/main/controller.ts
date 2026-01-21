import path from 'path';
import type { Request, Response } from 'express';
import MainService from './service.js';
import { createAndSendServerJsonResponseFromService } from '../../core/services/responses/typedResponses.js';

export default class MainController {
    mainService: MainService;

    constructor() {
        this.mainService = new MainService();
    }

    getIndex(_req: Request, res: Response) {
        //res.sendFile(path.join(process.cwd(), 'public', 'index', 'index.html'));
        res.send('Server is running');
    }

    async getDBTest(_req: Request, res: Response) {
        const result = await this.mainService.getDBTest();
        createAndSendServerJsonResponseFromService(res, result);
    }

    getHealthStatus(_req: Request, res: Response) {
        res.status(200).json({ status: 'ok' });
    }

    getFavicon(_req: Request, res: Response) {
        res.status(204).end();
    }

    getInfo(req: Request, res: Response) {
        const { code, msg } = req.query;
        res.status(200).json({ code, message: msg });
    }
}
