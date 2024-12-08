import axios from 'axios';
import { TestContext } from '../../main';
import { AuthDataModel } from '../../../src/server/models/mongo/auth-data';
import { Types } from 'mongoose';
import {sign} from "jsonwebtoken";

export async function runVerifyEmailTest(context: TestContext) {
    if (!context.userId) {
        throw new Error('missing required context for email verification test');
    }

    const authData = await AuthDataModel.findOne({
        userId: new Types.ObjectId(context.userId)
    });

    if (!authData) throw new Error('auth data not found');

    const tokenPayload = {
        authId: authData._id.toString(),
        userId: authData.userId.toString()
    };

    const verificationToken = sign(tokenPayload, 'secret', { expiresIn: '48h' });

    await axios.get(
        `${context.baseUrl}/api/auth/verify-email?token=${verificationToken}`,
        {
            validateStatus: () => true
        }
    );

    const updatedAuthData = await AuthDataModel.findOne({
        userId: new Types.ObjectId(context.userId)
    });

    if (!updatedAuthData?.emailVerified) {
        throw new Error('email not marked as verified in database');
    }
}