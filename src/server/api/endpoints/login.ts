import { ApiEndpointConfig, ApiRequest, ApiResponse } from '../types';
import AuthManager from '../../controllers/auth-manager';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

type LoginRequest = z.infer<typeof loginSchema>;

export const loginEndpoint: ApiEndpointConfig<LoginRequest, false> = {
    path: '/api/auth/login',
    method: 'post',
    requiresAuth: false,
    handler: async (req: ApiRequest<LoginRequest>, res: ApiResponse): Promise<void> => {
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
                        id: result.auth._id,
                        name: result.auth.name,
                        email: result.auth.email
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
};