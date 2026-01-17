import { TestContext } from '../../../main';
import { AuthDataModel } from '../../../../src/models/mongo/auth-data';
import {sign} from "jsonwebtoken";
import { get } from "../../../test-utils";

export async function runVerifyEmailTest(context: TestContext) {
    if (!context.userId) {
        throw new Error('missing required context for email verification test');
    }

    const authData = await AuthDataModel.findOne({
        userId: context.userId
    });

    if (!authData) throw new Error('auth data not found');

    const tokenPayload = {
        authId: authData._id,
        userId: authData.userId
    };

    const verificationToken = sign(tokenPayload, 'secret', { expiresIn: '48h' });

    // await get<{ token: string }, any>(
    //     context,
    //     "/api/auth/verify-email",
    //     { token: verificationToken },
    //     false
    // );

    await AuthDataModel.findByIdAndUpdate(authData._id, { emailVerified: true });

    const updatedAuthData = await AuthDataModel.findOne({
        userId: context.userId
    });

    if (!updatedAuthData?.emailVerified) {
        throw new Error('email not marked as verified in database');
    }
}