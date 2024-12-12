import { ApiEndpoint } from '../../types';
import AuthManager from '../../../controllers/auth-manager';
import { z } from 'zod';

const registerSchema = z.object({
    name: z.string().trim().min(1),
    email: z.string().trim().email(),
    password: z.string().min(4)
});

type RegisterRequest = z.infer<typeof registerSchema>;

interface RegisterResponse {
    id: string;
    name: string;
    email: string;
}

export const registerEndpoint: ApiEndpoint<RegisterRequest, RegisterResponse> = {
    path: '/api/auth/register',
    method: 'post',
    handler: async (req, res) => {
        try {
            const data = registerSchema.parse(req.body);

            const { user, auth } = await AuthManager.getInstance().register(
                data.name,
                data.email,
                data.password
            );

            res.json({
                success: true,
                data: {
                    id: user._id.toString(),
                    name: user.name,
                    email: auth.email
                }
            });
        } catch (error) {
            let message = 'Failed to create account';

            if (error instanceof z.ZodError) {
                message = error.errors[0].message;
            } else if (error instanceof Error) {
                message = error.message;
            }

            res.status(400).json({
                success: false,
                error: message
            });
        }
    }
};