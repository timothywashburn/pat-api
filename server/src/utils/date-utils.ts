import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { DateOnlyString } from "@timothyw/pat-common";

export default class DateUtils {
    // TODO: this is probably bad; should be switched to use TZDate
    static toLocalDateOnlyString(date: Date, timezone: string): DateOnlyString {
        const localDate = toZonedTime(date, timezone);
        return format(localDate, 'yyyy-MM-dd') as DateOnlyString;
    }
}