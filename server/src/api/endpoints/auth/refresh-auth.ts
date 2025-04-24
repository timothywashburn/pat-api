import { ApiEndpoint } from '../../types';
import AuthManager from '../../../controllers/auth-manager';
import { z } from 'zod';
import { PublicAuthData } from "../../../models/mongo/auth-data";
import { UserConfig } from "../../../models/mongo/user-config";
import { AuthTokens } from "@timothyw/pat-common";

const refreshTokenSchema = z.object({
    refreshToken: z.string()
});

type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;

export interface RefreshAuthResponse {
    tokenData: AuthTokens;
    authData: PublicAuthData;
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
                data: result
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