export enum SystemSocketEvents {
    // Sys
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',

    PING = 'ping',
    PONG = 'pong',
    ERROR = 'error',
    SERVER_MESSAGE = 'server:message', // system notifications

    // Auth
    AUTH_REQUIRED = 'auth:required',
    AUTH_SUCCESS = 'auth:success',
    AUTH_FAILED = 'auth:failed',

    // Common triggers
    ENTITY_CREATED = 'entity:created',
    ENTITY_UPDATED = 'entity:updated',
    ENTITY_DELETED = 'entity:deleted',
}

export interface SystemEventPayloads {
    [SystemSocketEvents.CONNECT]: void;
    [SystemSocketEvents.DISCONNECT]: { reason: string };

    [SystemSocketEvents.PING]: { timestamp: number };
    [SystemSocketEvents.PONG]: { timestamp: number };
    [SystemSocketEvents.ERROR]: { code: number; message: string };
    [SystemSocketEvents.SERVER_MESSAGE]: {
        type: 'info' | 'warning' | 'error';
        text: string;
    };

    [SystemSocketEvents.AUTH_REQUIRED]: void;
    [SystemSocketEvents.AUTH_SUCCESS]: { userId: string; token: string };
    [SystemSocketEvents.AUTH_FAILED]: { reason: string };

    [SystemSocketEvents.ENTITY_CREATED]: {
        entity: string;
        id: string;
        payload: Record<string, unknown>;
    };

    [SystemSocketEvents.ENTITY_UPDATED]: {
        entity: string;
        id: string;
        changes: Record<string, unknown>;
    };

    [SystemSocketEvents.ENTITY_DELETED]: {
        entity: string;
        id: string;
    };
}
