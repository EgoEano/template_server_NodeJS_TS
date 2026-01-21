import { pool } from '../../core/services/connection/pool.js';
import type { PoolType } from '../../core/services/connection/poolFactory_psql.js';

export default class MainRepository {
    pool: PoolType;

    constructor() {
        this.pool = pool;
    }

    /**
     * Returns test answer
     * @param {string} _param - Test argument
     * @returns {Promise<Object|null>} - Returns data or null
     */
    async getDBTest(_param: string): Promise<any[]> {
        const result = await this.pool.query('SELECT 1', []);
        return result.rows;
    }
}
