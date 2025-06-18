import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { addDays, format, isBefore } from "date-fns";
import { DateOnlyString, DateString } from "@timothyw/pat-common";

export default class DateUtils {
    static toDateOnlyString(dateString: DateString) {
        return dateString.split('T')[0] as DateOnlyString;
    }

    static toLocalDateOnlyString(date: Date, timezone: string): DateOnlyString {
        const localDate = toZonedTime(date, timezone);
        return format(localDate, 'yyyy-MM-dd') as DateOnlyString;
    }

    static fromLocalDateString(dateString: DateOnlyString, timezone: string): Date {
        const localDate = new Date(`${dateString}T00:00:00`);
        return fromZonedTime(localDate, timezone);
    }

    static dateInTimezoneAsUTC(dateString: DateOnlyString, hours: number, minutes: number, seconds: number, timezone: string): Date {
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const localDateTime = new Date(`${dateString}T${timeString}`);
        return fromZonedTime(localDateTime, timezone);
    }

    static nextTimeInTimezoneAsUTC(hours: number, minutes: number, seconds: number, timezone: string): Date {
        const now = new Date();
        const utcDate = this.dateInTimezoneAsUTC(this.toLocalDateOnlyString(now, timezone), hours, minutes, seconds, timezone);
        if (!isBefore(utcDate, now)) return utcDate;
        const nextDay = addDays(now, 1);
        return this.dateInTimezoneAsUTC(this.toLocalDateOnlyString(nextDay, timezone), hours, minutes, seconds, timezone);
    }
}