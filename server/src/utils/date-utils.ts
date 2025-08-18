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

    static formatTimeDuration(milliseconds: number): string {
        const seconds = Math.abs(milliseconds) / 1000;
        const minutes = seconds / 60;
        const hours = minutes / 60;
        const days = hours / 24;

        if (days >= 1) {
            return `${Math.floor(days)} day${days >= 2 ? 's' : ''}`;
        } else if (hours >= 1) {
            return `${Math.floor(hours)} hour${hours >= 2 ? 's' : ''}`;
        } else if (minutes >= 1) {
            return `${Math.floor(minutes)} minute${minutes >= 2 ? 's' : ''}`;
        } else {
            return `${Math.floor(seconds)} second${seconds >= 2 ? 's' : ''}`;
        }
    }
}