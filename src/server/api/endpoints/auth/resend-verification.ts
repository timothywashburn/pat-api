import { ApiEndpoint } from '../../types';
import AuthManager from '../../../controllers/auth-manager';

interface ResendVerificationResponse {
    sent: boolean;
}

export const resendVerificationEndpoint: ApiEndpoint<unknown, ResendVerificationResponse> = {
    path: '/api/auth/resend-verification',
    method: 'post',
    auth: 'authenticated',
    handler: async (req, res) => {
        try {
            const sent = await AuthManager.getInstance().resendVerificationEmail(req.auth!.authId);

            if (!sent) {
                res.status(400).json({
                    success: false,
                    error: 'Failed to resend verification email'
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    sent: true
                }
            });
        } catch (error) {
            console.error('Error in resendVerification:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
};