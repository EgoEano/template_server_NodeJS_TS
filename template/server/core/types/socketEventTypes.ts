import type http from 'http';
import type https from 'https';
import type { Server, Socket } from 'socket.io';

import { SystemSocketEvents } from './socketEvents_System.js';
// Add your event files

import type { ServerOptions } from 'socket.io';
import type { createAdapter } from '@socket.io/redis-adapter';
import type { SystemEventPayloads } from './socketEvents_System.js';
// Add your event payload types

export const SocketEvents = {
    ...SystemSocketEvents,
    //...TestPayload // add here your payload event files
};

// All payloads
export type EventPayloads = SystemEventPayloads; // add here your payload types

// Type helpers socket.emit and socket.on
export type EventNames = keyof EventPayloads;

// Payload for special event
export type EventPayload<T extends EventNames> = EventPayloads[T];

// Universal handler
export type SocketEventHandler<K extends EventNames> = (
    ctx: { io: Server; socket: Socket },
    payload: EventPayloads[K],
) => void;

export type SocketEventHandlerMap = {
    [K in EventNames]?: SocketEventHandler<K>;
};

export interface SocketServerInitProps {
    server: http.Server | https.Server;
    options: Partial<ServerOptions>;
    adapter: ReturnType<typeof createAdapter>;
    handlers?: SocketEventHandlerMap | null;
}

export interface RegisterSocketEventHandler<K extends EventNames> {
    io: Server;
    socket: Socket;
    event: K;
    handler: SocketEventHandler<K>;
}
