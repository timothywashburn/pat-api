import { ApiEndpoint } from '../../types';
import AuthManager from '../../../controllers/auth-manager';
import { z } from 'zod';
import MailjetManager from "../../../controllers/mailjet-manager";
import ConfigManager from '../../../controllers/config-manager';
import { RegisterRequest, registerRequestSchema, RegisterResponse } from "@timothyw/pat-common";

export const registerEndpoint: ApiEndpoint<RegisterRequest, RegisterResponse> = {
    path: '/api/auth/register',
    method: 'post',
    handler: async (req, res) => {
        try {
            const data = registerRequestSchema.parse(req.body);

            const config = ConfigManager.getConfig();
            const authorizedEmails = config.dev?.authorizedEmails || [];

            if (!authorizedEmails.includes(data.email.toLowerCase())) {
                res.status(403).json({
                    success: false,
                    error: "You are not authorized to register. Contact me and I'll add you."
                });
                return;
            }

            const { tokenData, authData, user } = await AuthManager.getInstance().register(
                data.name,
                data.email,
                data.password
            );

            if (!data.skipVerificationEmail) await MailjetManager.getInstance().sendVerificationEmail(authData);

            res.json({
                success: true,
                data: {
                    id: user._id.toString(),
                    name: user.name,
                    email: authData.email
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