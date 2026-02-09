import type { Response } from 'express';


const sucessServerStatuses = {
    200: 'OK',
    201: 'Created',
};
export type SucessStatusCode = keyof typeof sucessServerStatuses;
export const errorServerStatuses = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
};
export type ErrorStatusCode = keyof typeof errorServerStatuses;
export const serverStatuses = {
    ...sucessServerStatuses,
    ...errorServerStatuses
};
export type StatusCode = keyof typeof serverStatuses;

export type ServiceResponse<T = unknown> = {
    success: true;
    data: T;
    code?: SucessStatusCode;
} | {
    success: false;
    code: ErrorStatusCode;
    errors: string[];
};

export type ServerResponse<T = unknown> = {
    status: StatusCode;
    message: string;
    data?: T | null;
    errors?: string[] | null;
};


//#region Service
export function createServiceResponse<T = unknown>(props: ServiceResponse<T>): ServiceResponse<T> {
    return props;
}
//#endregion

//#region Server
export function createServerResponseFromService<T = unknown>(
    resp: ServiceResponse<T>
): ServerResponse<T> {
    if (resp.success) {
        return {
            status: resp.code || 200,
            message: serverStatuses[resp.code || 200],
            data: resp.data
        }
    } else {
        return {
            status: resp.code,
            message: serverStatuses[resp.code],
            errors: resp.errors
        }
    }
}

export function sendServerJsonResponse(res: Response, respObj: ServerResponse) {
    return res.status(respObj.status).json(respObj);
}

export function createAndSendServerJsonResponseFromService(
    res: Response,
    serviceResponse: ServiceResponse,
) {
    const prepared = createServerResponseFromService(serviceResponse);
    return sendServerJsonResponse(res, prepared);
}
//#endregion
