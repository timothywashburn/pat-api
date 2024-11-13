import { ApiRequest, ApiResponse, AuthenticatedRequest } from '../types';
import { verify } from 'jsonwebtoken';
import { Types } from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const createAuthMiddleware = <T>(
    handler: (req: AuthenticatedRequest<T>, res: ApiResponse) => Promise<void>
) => {
    return async (req: ApiRequest<T>, res: ApiResponse): Promise<void> => {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'No token provided'
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = verify(token, JWT_SECRET) as { userId: string };
            const authenticatedReq = req as AuthenticatedRequest<T>;
            authenticatedReq.userId = new Types.ObjectId(decoded.userId);
            await handler(authenticatedReq, res);
        } catch (error) {
            res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
    };
};