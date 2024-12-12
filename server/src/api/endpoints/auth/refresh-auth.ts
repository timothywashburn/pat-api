import { ApiEndpoint } from '../../types';
import AuthManager from '../../../controllers/auth-manager';
import { z } from 'zod';

const refreshTokenSchema = z.object({
    refreshToken: z.string()
});

type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;

interface RefreshAuthResponse {
    token: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        isEmailVerified: boolean;
    }
}

export const refreshAuthEndpoint: ApiEndpoint<RefreshTokenRequest, RefreshAuthResponse> = {
    path: '/api/auth/refresh',
    method: 'post',
    handler: async (req, res) => {
        try {
            const data = refreshTokenSchema.parse(req.body);
            const result = await AuthManager.getInstance().refreshAuth(data.refreshToken);

            if (!result) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid refresh token'
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    token: result.token,
                    refreshToken: result.refreshToken,
                    user: {
                        id: result.user._id.toString(),
                        name: result.user.name,
                        email: result.auth.email,
                        isEmailVerified: result.auth.emailVerified
                    }
                }
            });
        } catch (error) {
            let message = 'Token refresh failed';

            if (error instanceof z.ZodError) {
                message = error.errors[0].message;
            }

            res.status(400).json({
                success: false,
                error: message
            });
        }
    }
};