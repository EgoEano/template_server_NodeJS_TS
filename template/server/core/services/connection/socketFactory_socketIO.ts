import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import Logger from '../../middleware/loggers/loggerService.js';
import { SocketEvents } from '../../types/socketEventTypes.js';

import type {
    EventNames,
    EventPayloads,
    RegisterSocketEventHandler,
    SocketEventHandler,
    SocketEventHandlerMap,
    SocketServerInitProps,
} from '../../types/socketEventTypes.js';

const defaultHandlers: Partial<SocketEventHandlerMap> = {
    [SocketEvents.DISCONNECT]: ({ socket }, payload) => {
        Logger.log({
            message: `[Socket] User disconnected: ${socket.id}, reason: ${payload.reason}`,
            source: 'SocketServer.disconnect',
        });
    },
    [SocketEvents.ERROR]: ({ socket }, payload) => {
        Logger.error({
            message: `[Socket] Socket error from ${socket.id}, code=${payload.code}, message=${payload.message}`,
            source: 'SocketServer.error',
        });
    },
};

export function createSocketServer({
    server,
    options,
    adapter,
    handlers,
}: SocketServerInitProps): Server {
    const io = new Server(server, options);
    io.adapter(adapter);

    io.on('connection', (socket: Socket) => {
        //This is clear version without auth logic
        Logger.log({
            message: `[Socket] User connected: ${socket.id}`,
            source: 'SocketServer.connection',
        });

        const mergedHandlers: SocketEventHandlerMap = {
            ...defaultHandlers,
            ...handlers,
        };

        for (const [event, handler] of Object.entries(mergedHandlers) as [
            EventNames,
            SocketEventHandler<any>,
        ][]) {
            if (typeof handler === 'function') {
                registerHandler({
                    io,
                    socket,
                    event: event,
                    handler: handler as SocketEventHandler<typeof event>,
                });
            } else {
                Logger.warn({
                    message: `[Socket] The handler '${String(event)}' must be of function type only.`,
                    source: 'SocketServer.register',
                });
            }
        }
    });
    return io;
}

function registerHandler<K extends EventNames>({
    io,
    socket,
    event,
    handler,
}: RegisterSocketEventHandler<K>): void {
    socket.on(event as string, (data: EventPayloads[K]) => {
        handler({ io, socket }, data);
    });
}
