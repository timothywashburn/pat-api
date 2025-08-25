import { TestContext } from '../../../main';
import {
    CreateNotificationTemplateResponse,
    NotificationTemplateLevel,
    NotificationEntityType,
    NotificationSchedulerType, NotificationVariantType, CreateNotificationTemplateRequest
} from "@timothyw/pat-common";
import { post } from "../../../test-utils";

export async function runCreateNotificationTemplatesTest(context: TestContext) {
    let response;

    // response = await post<CreateNotificationTemplateRequest, CreateNotificationTemplateResponse>(
    //     context,
    //     "/api/notifications/templates",
    //     {
    //         targetLevel: NotificationTemplateLevel.ENTITY,
    //         targetEntityType: NotificationEntityType.AGENDA_ITEM,
    //         targetId: context.itemIds[1],
    //         schedulerData: {
    //             type: NotificationSchedulerType.RELATIVE_DATE,
    //             offsetMinutes: -60
    //         },
    //         variantData: {
    //             type: NotificationVariantType.AGENDA_ITEM_UPCOMING_DEADLINE
    //         },
    //         active: true
    //     }
    // );
    // if (!response.success) throw new Error(`Failed to create notification template`);

    response = await post<CreateNotificationTemplateRequest, CreateNotificationTemplateResponse>(
        context,
        "/api/notifications/templates",
        {
            targetLevel: NotificationTemplateLevel.ENTITY,
            targetEntityType: NotificationEntityType.HABIT,
            targetId: context.habitIds[1],
            schedulerData: {
                type: NotificationSchedulerType.RELATIVE_DATE,
                offsetMinutes: -60
            },
            variantData: {
                type: NotificationVariantType.HABIT_INCOMPLETE
            },
            active: true
        }
    );
    if (!response.success) throw new Error(`Failed to create notification template`);
}