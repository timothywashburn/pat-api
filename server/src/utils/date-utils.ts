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
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        const normalizedHours = Math.floor(totalSeconds / 3600) % 24;
        const normalizedMinutes = Math.floor((totalSeconds % 3600) / 60);
        const normalizedSeconds = totalSeconds % 60;
        const additionalDays = Math.floor(totalSeconds / (24 * 3600));

        const timeString = `${normalizedHours.toString().padStart(2, '0')}:${normalizedMinutes.toString().padStart(2, '0')}:${normalizedSeconds.toString().padStart(2, '0')}`;
        const baseDateTime = new Date(`${dateString}T${timeString}`);
        const localDateTime = addDays(baseDateTime, additionalDays);
        return fromZonedTime(localDateTime, timezone);
    }

    static nextTimeInTimezoneAsUTC(hours: number, minutes: number, seconds: number, timezone: string, date: Date = new Date()): Date {
        // const now = new Date();
        const utcDate = this.dateInTimezoneAsUTC(this.toLocalDateOnlyString(date, timezone), hours, minutes, seconds, timezone);
        if (!isBefore(utcDate, date)) return utcDate;
        const nextDay = addDays(date, 1);
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