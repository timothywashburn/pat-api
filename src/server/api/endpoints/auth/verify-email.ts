import { ApiEndpoint } from '../../types';
import AuthManager from '../../../controllers/auth-manager';
import SocketManager from "../../../controllers/socket-manager";

interface VerifyEmailQuery {
    token?: string;
}

export const verifyEmailEndpoint: ApiEndpoint<unknown, never> = {
    path: '/api/auth/verify-email',
    method: 'get',
    handler: async (req, res) => {
        try {
            const { token } = req.query as VerifyEmailQuery;

            if (!token) {
                res.redirect(`https://${process.env.API_URL}/verify-failed?error=missing-token`);
                return;
            }

            const decoded = AuthManager.getInstance().verifyToken(token);
            if (!decoded) {
                res.redirect(`https://${process.env.API_URL}/verify-failed?error=invalid-token`);
                return;
            }

            const success = await AuthManager.getInstance().verifyEmail(decoded.authId);
            if (!success) {
                res.redirect(`https://${process.env.API_URL}/verify-failed?error=verification-failed`);
                return;
            }

            SocketManager.getInstance().notifyUser(
                decoded.userId.toString(),
                'emailVerified'
            );

            res.redirect(`https://${process.env.API_URL}/verify-success`);
        } catch (error) {
            console.error('Error in verifyEmail:', error);
            res.redirect(`https://${process.env.API_URL}/verify-failed?error=unknown`);
        }
    }
};