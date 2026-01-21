import { getPools } from '../../services/connection/pool.js';
import type { LogParams, ErrorParams, NormalizedError, WriterParams } from '../../types/types.js';

const LOG_LEVELS = {
    debug: 1,
    log: 2,
    warn: 3,
    error: 4,
};

class Logger {
    debug({ message, source, isWriteDB = true }: LogParams): void {
        console.log(`[DEBUG] ${this.formatDate()} - ${message}`);
        if (isWriteDB) {
            this.writeToDatabase({
                levelKey: 'debug',
                message,
                source,
                error: null,
            });
        }
    }

    log({ message, source, isWriteDB = true }: LogParams): void {
        console.log(`[LOG] ${this.formatDate()} - ${message}`);
        if (isWriteDB) {
            this.writeToDatabase({
                levelKey: 'log',
                message,
                source,
                error: null,
            });
        }
    }

    warn({ message, source, isWriteDB = true }: LogParams): void {
        console.warn(`[WARN] ${this.formatDate()} - ${message}`);
        if (isWriteDB) {
            this.writeToDatabase({
                levelKey: 'warn',
                message,
                source,
                error: null,
            });
        }
    }

    error({ message, error, source = null, isWriteDB = true }: ErrorParams): void {
        console.error(`[ERROR] ${this.formatDate()} - ${message}`);
        let errs: NormalizedError[] = [];
        if (error) {
            const aligned = this.alignErrors(error);
            errs = aligned ?? [];
            console.group('[ERROR REPORT]');
            errs.forEach((err, index) => {
                console.group(`[${index + 1}] Type: ${err.type}`);
                console.log(`Message: ${err.message}`);
                if (err.stack && err.stack.length) {
                    console.group('Stack trace:');
                    err.stack.forEach((line) => console.log(line));
                    console.groupEnd();
                }
                console.groupEnd();
            });
            console.groupEnd();
        }

        if (isWriteDB) {
            this.writeToDatabase({
                levelKey: 'error',
                message,
                source,
                error: errs,
            });
        }
    }

    alignErrors(errors: unknown): NormalizedError[] {
        if (!errors) return [];

        const list = Array.isArray(errors) ? errors : [errors];

        return list
            .map((e) => {
                try {
                    return this.normalizeError(e);
                } catch {
                    return null;
                }
            })
            .filter((e): e is NormalizedError => Boolean(e));
    }

    normalizeError(error: unknown): NormalizedError | null {
        if (!error) return null;

        if (error instanceof Error) {
            return {
                type: 'error',
                message: error.message,
                stack: error.stack?.split('\n').map((line) => line.trim()) || [],
            };
        } else if (typeof error === 'string') {
            return {
                type: 'string',
                message: error,
                stack: [],
            };
        } else {
            return {
                type: typeof error,
                message: (() => {
                    try {
                        return JSON.stringify(error);
                    } catch {
                        return String(error);
                    }
                })(),
                stack: [],
            };
        }
    }

    async writeToDatabase({ levelKey, message, error = null, source = null }: WriterParams) {
        let pool;
        try {
            ({ pool } = getPools()); // runtime
        } catch {
            console.warn('[LOGGER] Pools не инициализированы, пропускаем запись в DB');
            return;
        }

        const level = LOG_LEVELS[levelKey as keyof typeof LOG_LEVELS];
        try {
            // await pool.query(
            //     `INSERT INTO common.logs (level, source, message, data) VALUES ($1, $2, $3, $4)`,
            //     [level, source, message, error ? JSON.stringify(error) : null]
            // );
        } catch (err) {
            console.error('[ERROR] Failed to write log to DB:', err);
        }
    }

    formatDate(): string {
        return new Date().toISOString();
    }
}

export default new Logger();
