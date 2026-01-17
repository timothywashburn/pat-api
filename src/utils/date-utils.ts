import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { DateOnlyString } from "@timothyw/pat-common";
import { TZDate } from "@date-fns/tz";

export default class DateUtils {
    // TODO: this is probably bad; should be switched to use TZDate
    static toLocalDateOnlyString(date: Date, timezone: string): DateOnlyString {
        const localDate = toZonedTime(date, timezone);
        return format(localDate, 'yyyy-MM-dd') as DateOnlyString;
    }

    static parseISOAsLocalTime(isoString: string, timezone: string): TZDate {
        const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2}))?/);
        if (!match) {
            throw new Error(`Invalid ISO date format: ${isoString}`);
        }
        const [_, year, month, day, hours = '0', minutes = '0', seconds = '0'] = match;
        return new TZDate(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hours),
            parseInt(minutes),
            parseInt(seconds),
            timezone
        );
    }
}