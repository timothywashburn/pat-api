import { ApiEndpoint } from '../../types';
import AuthManager from '../../../controllers/auth-manager';
import { z } from 'zod';
import { RefreshAuthRequest, refreshAuthRequestSchema, RefreshAuthResponse } from "@timothyw/pat-common";

export const refreshAuthEndpoint: ApiEndpoint<RefreshAuthRequest, RefreshAuthResponse> = {
    path: '/api/auth/refresh',
    method: 'post',
    handler: async (req, res) => {
        try {
            const data = refreshAuthRequestSchema.parse(req.body);
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
                ...result
            });
        } catch (error) {
            let message = 'Token refresh failed';

            if (error instanceof z.ZodError) {
                message = error.issues[0].message;
            }

            res.status(400).json({
                success: false,
                error: message
            });
        }
    }
};