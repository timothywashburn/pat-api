import { ApiEndpoint } from '../../types';
import AuthManager from '../../../controllers/auth-manager';
import { z } from 'zod';
import { SignInRequest, signInRequestSchema, SignInResponse } from "@timothyw/pat-common";

export const signInEndpoint: ApiEndpoint<SignInRequest, SignInResponse> = {
    path: '/api/auth/sign-in',
    method: 'post',
    handler: async (req, res) => {
        try {
            const data = signInRequestSchema.parse(req.body);
            const result = await AuthManager.getInstance().signIn(
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

            console.log(`User ${data.email} signed in successfully`);

            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            let message = 'Sign in failed';

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