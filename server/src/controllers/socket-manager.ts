import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { TokenPayload } from "@timothyw/pat-common";

export interface SocketMessage<T = any> {
    type: string;
    userId: string;
    data: T;
}

export default class SocketManager {
    private static instance: SocketManager;
    private io: Server;

    private constructor(server: HttpServer) {
        console.log('[socket] initializing manager...');

        this.io = new Server(server, {
            path: '/ws',
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                allowedHeaders: ["Authorization"],
                credentials: true
            }
        });

        this.setupSocketServer();
    }

    private setupSocketServer() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token ||
                    socket.handshake.query.token ||
                    socket.handshake.headers.authorization?.replace('Bearer ', '');

                if (!token) {
                    console.log(`[socket] auth failed for socket ${socket.id}: no token`);
                    return next(new Error('Authentication error'));
                }

                const decoded = verify(token, process.env.JWT_SECRET!) as TokenPayload;
                socket.data.userId = decoded.userId;
                console.log(`[socket] auth success for socket ${socket.id} user ${decoded.userId}`);
                next();
            } catch (error) {
                console.log(`[socket] auth failed for socket ${socket.id}:`, error);
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket: Socket) => {
            const userId = socket.data.userId;
            console.log(`[socket] client connected - id: ${socket.id} user: ${userId}`);

            socket.join(`user:${userId}`);

            socket.on('heartbeat', (data) => {
                console.log(`[socket] heartbeat from ${socket.id}`);
                socket.emit('heartbeat_ack', { id: data.id });
            });

            socket.on('disconnect', (reason) => {
                console.log(`[socket] client disconnected - id: ${socket.id} user: ${userId} reason: ${reason}`);
            });
        });

        this.io.engine.on('connection_error', (err) => {
            console.log(`[socket] connection error - code: ${err.code} message: ${err.message}`);
        });
    }

    emitToUser<T extends object>(userId: string, type: string, data: T = {} as T) {
        let message: SocketMessage<T> = {type, userId, data}
        console.log(`[socket] sending to user ${userId}:`, message);
        this.io.to(`user:${userId}`).emit('message', message);
    }

    static initialize(server: HttpServer): SocketManager {
        if (!SocketManager.instance) {
            SocketManager.instance = new SocketManager(server);
        }
        return SocketManager.instance;
    }

    static getInstance(): SocketManager {
        if (!SocketManager.instance) {
            throw new Error('SocketManager not initialized');
        }
        return SocketManager.instance;
    }
}