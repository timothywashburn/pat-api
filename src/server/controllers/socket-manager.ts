import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { TokenPayload } from './auth-manager';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default class SocketManager {
    private static instance: SocketManager;
    private io: Server;

    private constructor(server: HttpServer) {
        console.log('initializing socket manager...');

        // TODO

        console.log('socket.io server initialized');
        this.setupSocketServer();
    }

    private setupSocketServer() {
        this.io.use(async (socket, next) => {
            try {
                console.log('authenticating socket connection...');
                const token = socket.handshake.auth.token ||
                    socket.handshake.headers.authorization?.replace('Bearer ', '');

                if (!token) {
                    console.log('socket auth failed: no token provided');
                    return next(new Error('Authentication error'));
                }

                const decoded = verify(token, JWT_SECRET) as TokenPayload;
                socket.data.userId = decoded.userId;
                console.log('socket auth successful for user:', decoded.userId);
                next();
            } catch (error) {
                console.log('socket auth failed:', error);
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket: Socket) => {
            console.log('client connected:', {
                socketId: socket.id,
                userId: socket.data.userId
            });

            // Join user-specific room
            const userId = socket.data.userId;
            socket.join(`user:${userId}`);

            // Handle client events
            socket.on('heartbeat', (data) => {
                socket.emit('heartbeat_ack', { id: data.id });
            });

            socket.on('disconnect', (reason) => {
                console.log('client disconnected:', {
                    socketId: socket.id,
                    userId: socket.data.userId,
                    reason
                });
            });
        });

        // Server-wide error handling
        this.io.engine.on('connection_error', (err) => {
            console.log('socket.io connection_error:', {
                code: err.code,
                message: err.message,
                context: err.context
            });
        });
    }

    notifyUser(userId: string, event: string, data: any = {}) {
        console.log('notifying user:', userId, 'event:', event);
        this.io.to(`user:${userId}`).emit(event, data);
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