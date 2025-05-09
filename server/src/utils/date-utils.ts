export class DateUtils {
    static addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(date.getDate() + days);
        return result;
    }

    static setTime(date: Date, hours: number, minutes: number, seconds: number = 0): Date {
        const result = new Date(date);
        result.setHours(hours, minutes, seconds, 0);
        return result;
    }

    static startOfDay(date: Date): Date {
        const result = new Date(date);
        result.setHours(0, 0, 0, 0);
        return result;
    }

    static isSameDay(date1: Date, date2: Date): boolean {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    }

    static isToday(date: Date): boolean {
        const today = new Date();
        return this.isSameDay(date, today);
    }

    static inPast(date: Date): boolean {
        const now = new Date();
        return date < now;
    }

    static formatDate(date: Date, format: string = 'MM-DD-YYYY HH:mm:ss'): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', String(year))
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }

    static formatDuration(milliseconds: number, includeMilliseconds: boolean = false): string {
        if (milliseconds < 0) {
            console.warn("negative duration provided to formatDuration");
            milliseconds = Math.abs(milliseconds);
        }

        const ms = milliseconds % 1000;
        const totalSeconds = Math.floor(milliseconds / 1000);
        const seconds = totalSeconds % 60;
        const totalMinutes = Math.floor(totalSeconds / 60);
        const minutes = totalMinutes % 60;
        const hours = Math.floor(totalMinutes / 60);

        const parts: string[] = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
        if (seconds > 0 || minutes > 0 || hours > 0) parts.push(`${seconds}s`);
        if (includeMilliseconds && (ms > 0 || parts.length === 0)) parts.push(`${ms}ms`);
        if (parts.length === 0) return includeMilliseconds ? "0ms" : "0s";

        return parts.join(" ");
    }
}