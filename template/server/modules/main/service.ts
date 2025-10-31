import dotenv from 'dotenv';
import MainRepository from './repository.js';
import { createServiceResponse } from '../../core/services/responses/typedResponses.js';

import type { ServiceResponse } from '../../core/services/responses/typedResponses.js';

dotenv.config();

export default class MainService {
    mainRepository: MainRepository;

    constructor() {
        this.mainRepository = new MainRepository();
    }

    async getDBTest(): Promise<ServiceResponse> {
        const result = await this.mainRepository.getDBTest('test param');
        return createServiceResponse({
            success: true,
            data: result
        });
    }
}