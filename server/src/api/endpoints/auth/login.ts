import { ApiEndpoint } from '../../types';
import AuthManager from '../../../controllers/auth-manager';
import { z } from 'zod';
import { LoginRequest, loginRequestSchema, LoginResponse } from "@timothyw/pat-common";

export const loginEndpoint: ApiEndpoint<LoginRequest, LoginResponse> = {
    path: '/api/auth/login',
    method: 'post',
    handler: async (req, res) => {
        try {
            const data = loginRequestSchema.parse(req.body);
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

            console.log(`User ${data.email} logged in successfully`);

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