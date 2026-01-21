import type { Response } from 'express';

export type ServiceResponse = {
    success: boolean;
    data?: any | null;
    message?: string | null;
    code?: number | null;
    errors?: any[] | null;
};

export type ServerResponse = {
    status: number;
    message: string;
    data?: any | null;
    errors?: any[] | null;
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
export function createServiceResponse({
    success,
    data = null,
    message = null,
    code = null,
    errors = null,
}: ServiceResponse): ServiceResponse {
    return {
        success,
        data,
        message,
        code,
        errors: Array.isArray(errors) ? errors : errors ? [errors] : [],
    };
}
//#endregion

//#region Server
export function createServerResponseFromService(
    {
        success,
        message = null,
        data = null,
        code = null,
        errors = null,
    }: {
        success: boolean;
        data?: any | null;
        message?: string | null;
        code?: number | null;
        errors?: any[] | null;
    },
    additionalCode: number | null = null,
): ServerResponse {
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
    serviceResponse: ServiceResponse = {
        success: false,
        data: null,
        message: null,
        code: null,
        errors: [],
    },
    additionalCode: number | null = null,
) {
    const prepared = createServerResponseFromService(serviceResponse, additionalCode);
    return sendServerJsonResponse(res, prepared);
}
//#endregion
