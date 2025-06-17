import { fromZonedTime, toZonedTime } from "date-fns-tz";

export default class LocalDate {
    public date: Date;
    private readonly timezone: string;

    private constructor(date: Date, timezone: string) {
        this.date = toZonedTime(date, timezone);
        this.timezone = timezone;
    }

    toLocalYYYYMMDD(): string {
        const year = this.date.getFullYear();
        const month = String(this.date.getMonth() + 1).padStart(2, '0');
        const day = String(this.date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    toUTCDate(): Date {
        return fromZonedTime(this.date, this.timezone);
    }

    toUTCTime(): number {
        return fromZonedTime(this.date, this.timezone).getTime();
    }

    static now(timezone: string): LocalDate {
        const now = new Date();
        return new LocalDate(now, timezone);
    }

    static today(timezone: string): LocalDate {
        const localNow = LocalDate.now(timezone);
        localNow.date.setHours(0, 0, 0, 0);
        return localNow;
    }

    static fromDate(date: Date, timezone: string): LocalDate {
        const zonedDate = toZonedTime(date, timezone);
        return new LocalDate(zonedDate, timezone);
    }

    static fromDateString(dateString: string, timezone: string): LocalDate {
        let date: Date;

        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            date = new Date(`${dateString}T00:00:00`);
            return LocalDate.fromDate(date, timezone);
        } else {
            date = new Date(dateString);
            if (isNaN(date.getTime())) throw new Error("Invalid date string");
            return LocalDate.fromDate(date, timezone);
        }
    }
}