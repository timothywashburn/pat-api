import { ApiEndpoint, ApiRequest, ApiResponse } from '../types';
import AuthManager from '../../controllers/auth-manager';
import { z } from 'zod';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

type LoginRequest = z.infer<typeof loginSchema>;

export const loginEndpoint: ApiEndpoint = {
    path: '/api/auth/login',
    method: 'post',
    handler: async (req: ApiRequest<LoginRequest>, res: ApiResponse): Promise<void> => {
        try {
            const data = loginSchema.parse(req.body);

            const auth = await AuthManager.getInstance().login(
                data.email,
                data.password
            );

            if (!auth) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
                return;
            }

            const token = sign(
                { userId: auth._id.toString() },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: auth._id,
                        name: auth.name,
                        email: auth.email
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