import type { Response } from 'express';

export type ServiceResponse<T = unknown> = {
    success: boolean;
    data?: T | null;
    message?: string | null;
    code?: number | null;
    errors?: string[] | null;
};

export type ServerResponse<T = unknown> = {
    status: number;
    message: string;
    data?: T | null;
    errors?: string[] | null;
};

const serverStatuses: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
};

//#region Service
export function createServiceResponse<T = unknown>(props: ServiceResponse<T>): ServiceResponse<T> {
    const { errors, ...rest } = props;
    return {
        ...rest,
        errors: Array.isArray(errors) ? errors : errors ? [errors] : [],
    };
}
//#endregion

//#region Server
export function createServerResponseFromService<T = unknown>(
    {
        success,
        message = null,
        data = null,
        code = null,
        errors = null,
    }: ServiceResponse<T>,
    additionalCode: number | null = null,
): ServerResponse<T> {
    let status: number;
    if (additionalCode != null && typeof additionalCode === 'number') {
        status = additionalCode;
    } else if (success === true) {
        status = 200;
    } else if (success === false && (errors?.length ?? 0) === 0) {
        status = 400;
    } else if ((errors?.length ?? 0) > 0) {
        status = 500;
    } else if (code != null && typeof code === 'number') {
        status = code;
    } else {
        status = 500;
    }

    const msg = typeof message === 'string' ? message : (serverStatuses[status] ?? '');

    return {
        status,
        message: msg,
        data,
        errors,
    };
}

export function sendServerJsonResponse(res: Response, respObj: ServerResponse) {
    return res.status(respObj.status).json(respObj);
}

export function createAndSendServerJsonResponseFromService(
    res: Response,
    serviceResponse: ServiceResponse,
    additionalCode: number | null = null,
) {
    const prepared = createServerResponseFromService(serviceResponse, additionalCode);
    return sendServerJsonResponse(res, prepared);
}
//#endregion
