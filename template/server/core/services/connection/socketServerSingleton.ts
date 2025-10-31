import {createSocketServer} from './socketFactory_socketIO'

import type { SocketServerInitProps } from "../../types/socketEventTypes";


let socketServerInstance: ReturnType<typeof createSocketServer> | null = null;

export function initSocketServer(props: SocketServerInitProps) {
    if (!socketServerInstance) {
        socketServerInstance = createSocketServer(props);
    }
    return socketServerInstance;
}

export function getSocketServer() {
    if (!socketServerInstance) throw new Error("Socket server is not initialized. Call initSocketServer first.");
    return socketServerInstance;
}