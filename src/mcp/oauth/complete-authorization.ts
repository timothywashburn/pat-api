import { Router } from 'express';
import AuthManager from '../../controllers/auth-manager';
import { PatOAuthProvider } from './oauth-provider';

export function createCompleteAuthorizationRouter(oauthProvider: PatOAuthProvider): Router {
    const router = Router();

    router.post('/oauth/complete-authorization', async (req, res) => {
        try {
            const { pending_id } = req.body;

            if (!pending_id) {
                res.status(400).json({
                    success: false,
                    error: 'Missing pending_id'
                });
                return;
            }

            let userId;
            const authHeader = req.headers.authorization;

            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const decoded = AuthManager.getInstance().verifyToken(token);

                if (!decoded) {
                    res.status(401).json({
                        success: false,
                        error: 'Invalid or expired token'
                    });
                    return;
                }

                userId = decoded.userId;
            }
            else {
                res.status(400).json({
                    success: false,
                    error: 'Either Authorization header or email/password required'
                });
                return;
            }

            const result = await oauthProvider.completeAuthorization(pending_id, userId);

            if (!result) {
                res.status(400).json({
                    success: false,
                    error: 'Authorization session expired. Please try again.'
                });
                return;
            }

            res.json({
                success: true,
                redirectUrl: result.redirectUrl
            });
        } catch (error) {
            console.error('OAuth authorization error:', error);
            res.status(500).json({
                success: false,
                error: 'An error occurred during authorization'
            });
        }
    });

    return router;
}
