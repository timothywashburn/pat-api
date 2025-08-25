import { TestContext } from '../../../main';
import {
    CreateNotificationTemplateResponse,
    NotificationTemplateLevel,
    NotificationEntityType,
    NotificationSchedulerType, NotificationVariantType, CreateNotificationTemplateRequest
} from "@timothyw/pat-common";
import { post } from "../../../test-utils";

export async function runCreateNotificationTemplatesTest(context: TestContext) {
    const secondItemId = context.itemIds[1];
    
    const response = await post<CreateNotificationTemplateRequest, CreateNotificationTemplateResponse>(
        context,
        "/api/notifications/templates",
        {
            targetLevel: NotificationTemplateLevel.ENTITY,
            targetEntityType: NotificationEntityType.AGENDA_ITEM,
            targetId: secondItemId,
            schedulerData: {
                type: NotificationSchedulerType.RELATIVE_DATE,
                offsetMinutes: -60
            },
            variantData: {
                type: NotificationVariantType.AGENDA_ITEM_UPCOMING_DEADLINE
            },
            active: true
        }
    );
    
    if (!response.success) {
        throw new Error(`Failed to create notification template`);
    }
}