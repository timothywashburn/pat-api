import { ApiEndpoint } from '../types';
import AuthManager from '../../controllers/auth-manager';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

interface LoginRequest {
    email: string;
    password: string;
}

interface LoginResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

export const loginEndpoint: ApiEndpoint<LoginRequest, LoginResponse> = {
    path: '/api/auth/login',
    method: 'post',
    requiresAuth: false,
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
                data: {
                    token: result.token,
                    user: {
                        id: result.user._id.toString(),
                        name: result.user.name,
                        email: data.email
                    }
                }
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
}