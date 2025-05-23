import MailjetService from "node-mailjet";
import ConfigManager from "./config-manager";
import { sign } from "jsonwebtoken";
import { AuthData, TokenPayload } from "@timothyw/pat-common";

export default class MailjetManager {
    private static instance: MailjetManager;
    private mailjet: MailjetService;

    private constructor() {
        const config = ConfigManager.getConfig();
        this.mailjet = new MailjetService({
            apiKey: config.mailjet.apiKey,
            apiSecret: config.mailjet.secretKey
        });
    }

    async sendVerificationEmail(auth: AuthData): Promise<boolean> {
        try {
            const tokenPayload: TokenPayload = {
                authId: auth._id.toString(),
                userId: auth.userId.toString()
            };

            const verificationToken = sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: '48h' });
            const verificationLink = `https://${process.env.API_URL}/api/auth/verify-email?token=${verificationToken}`;

            const data = {
                Messages: [{
                    From: {
                        Email: "noreply@timothyw.dev",
                        Name: "Planner and Tracker"
                    },
                    To: [{
                        Email: auth.email
                    }],
                    TemplateID: 6525498,
                    TemplateLanguage: true,
                    Subject: "Verify your email address",
                    Variables: {
                        VerificationLink: verificationLink
                    }
                }]
            };

            const result = await this.mailjet.post('send', { version: 'v3.1' }).request(data);
            return result.response.status === 200;
        } catch (error) {
            console.error('failed to send verification email:', error);
            return false;
        }
    }

    static getInstance(): MailjetManager {
        if (!MailjetManager.instance) {
            MailjetManager.instance = new MailjetManager();
        }
        return MailjetManager.instance;
    }
}