import axios from 'axios';
import { TestContext } from '../../../main';
import { Types } from 'mongoose';
import { ThoughtModel } from '../../../../src/models/mongo/thought-data';

interface DeleteThoughtResponse {
    success: boolean;
    data: {
        deleted: boolean;
    };
    error?: string;
}

export async function runDeleteThoughtTest(context: TestContext) {
    if (!context.authToken || !context.userId || !context.thoughtIds) {
        throw new Error('missing required context for delete test');
    }

    const deleteResponse = await axios.delete<DeleteThoughtResponse>(
        `${context.baseUrl}/api/thoughts/${context.thoughtIds[1]}`,
        {
            headers: {
                Authorization: `Bearer ${context.authToken}`
            }
        }
    );

    if (!deleteResponse.data.success) throw new Error('failed to delete thought');

    const thoughts = await ThoughtModel.find({
        userId: new Types.ObjectId(context.userId)
    });

    if (thoughts.length !== 1) throw new Error(`expected 1 remaining thought, found ${thoughts.length}`);
    if (thoughts[0]._id.toString() !== context.thoughtIds[0]) throw new Error('wrong thought was deleted');
}