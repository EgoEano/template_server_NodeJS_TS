import { SocketEvents } from '../../types/socketEventTypes.js';
import { createSocketServer } from './socketFactory_socketIO.js';

import type { Server, Socket } from 'socket.io';
import type {
    SocketEventHandler,
    EventNames,
    EventPayloads,
    SocketEventHandlerMap,
    SocketServerInitProps,
} from '../../types/socketEventTypes.js';

export class SocketEventBus {
    private server: Server;
    private handlers: SocketEventHandlerMap = {};
    private subscribers: {
        [K in EventNames]?: SocketEventHandler<K>[];
    } = {};

    constructor(props: SocketServerInitProps) {
        this.buildHandlers();
        this.server = createSocketServer({ ...props, handlers: this.handlers });
    }

    buildHandlers() {
        for (const event of Object.values(SocketEvents) as EventNames[]) {
            this.handlers[event] = (ctx, payload) => {
                this.publish(event, ctx, payload);
            };
        }
    }

    publish<K extends EventNames>(
        event: K,
        ctx: { io: Server; socket: Socket },
        payload: EventPayloads[K],
    ) {
        const subs = this.subscribers[event];
        if (subs) {
            for (const h of subs) h(ctx, payload);
        }
    }

    subscribe<K extends EventNames>(event: K, handler: SocketEventHandler<K>) {
        if (!this.subscribers[event]) this.subscribers[event] = [];
        this.subscribers[event].push(handler);
    }

    getHandlers(): SocketEventHandlerMap {
        return this.handlers;
    }

    getSubscribers(): { [K in EventNames]?: SocketEventHandler<K>[] } {
        return this.subscribers;
    }

    getServer(): Server {
        return this.server;
    }
}
