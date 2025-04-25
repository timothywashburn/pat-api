import { ApiEndpoint } from '../../types';
import AuthManager from '../../../controllers/auth-manager';
import SocketManager from "../../../controllers/socket-manager";
import {AuthDataModel} from "../../../models/mongo/auth-data";
import { VerifyEmailQuery } from "@timothyw/pat-common";

export const verifyEmailEndpoint: ApiEndpoint = {
    path: '/api/auth/verify-email',
    method: 'get',
    handler: async (req, res) => {
        try {
            const { token } = req.query as VerifyEmailQuery;

            if (!token) {
                res.redirect(`https://${process.env.API_URL}/verify-fail?error=invalid-token`);
                return;
            }

            const decoded = AuthManager.getInstance().verifyToken(token);
            if (!decoded) {
                res.redirect(`https://${process.env.API_URL}/verify-fail?error=invalid-token`);
                return;
            }

            const auth = await AuthDataModel.findById(decoded.authId);
            if (!auth) {
                res.redirect(`https://${process.env.API_URL}/verify-fail?error=verification-failed`);
                return;
            }

            if (auth.emailVerified) {
                res.redirect(`https://${process.env.API_URL}/verify-fail?error=already-verified`);
                return;
            }

            const success = await AuthManager.getInstance().verifyEmail(decoded.authId);
            if (!success) {
                res.redirect(`https://${process.env.API_URL}/verify-fail?error=verification-failed`);
                return;
            }

            SocketManager.getInstance().emitToUser(decoded.userId, "emailVerified");

            res.redirect(`https://${process.env.API_URL}/verify-success`);
        } catch (error) {
            console.error('Error in verifyEmail:', error);
            res.redirect(`https://${process.env.API_URL}/verify-fail?error=verification-failed`);
        }
    }
};