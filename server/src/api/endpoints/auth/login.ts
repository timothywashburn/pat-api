import { ApiEndpoint } from '../../types';
import AuthManager from '../../../controllers/auth-manager';
import { z } from 'zod';
import { PublicAuthData } from "../../../models/mongo/auth-data";
import { UserConfig } from "../../../models/mongo/user-config";
import { AuthTokens } from "@timothyw/pat-common";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

type LoginRequest = z.infer<typeof loginSchema>;

export interface LoginResponse {
    tokenData: AuthTokens;
    authData: PublicAuthData;
    user: UserConfig;
}

export const loginEndpoint: ApiEndpoint<LoginRequest, LoginResponse> = {
    path: '/api/auth/login',
    method: 'post',
    handler: async (req, res) => {
        try {
            const data = loginSchema.parse(req.body);
            const result = await AuthManager.getInstance().login(
                data.email,
                data.password
            );

            if (!result) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
                return;
            }

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            let message = 'Login failed';

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