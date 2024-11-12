import { ApiEndpoint, ApiRequest, ApiResponse } from '../types';
import AuthManager from '../../controllers/auth-manager';
import { z } from 'zod';

const createAccountSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6)
});

type CreateAccountRequest = z.infer<typeof createAccountSchema>;

export const createAccountEndpoint: ApiEndpoint = {
    path: '/api/account/create',
    method: 'post',
    handler: async (req: ApiRequest<CreateAccountRequest>, res: ApiResponse) => {
        try {
            const data = createAccountSchema.parse(req.body);

            const auth = await AuthManager.getInstance().register(
                data.name,
                data.email,
                data.password
            );

            res.json({
                success: true,
                data: {
                    id: auth._id,
                    name: auth.name,
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