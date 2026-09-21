import { DateTime } from "luxon";
import { AppError } from "../errors/appError.js";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function parseBusinessDate(date: string, timezone: string): DateTime {
  if (!ISO_DATE.test(date)) throw new AppError("VALIDATION_ERROR", 400, "Data inválida.");
  const parsed = DateTime.fromISO(date, { zone: timezone }).startOf("day");
  if (!parsed.isValid || parsed.toISODate() !== date) throw new AppError("VALIDATION_ERROR", 400, "Data inválida.");
  return parsed;
}

export function toBusinessInstant(date: string, time: string, timezone: string): Date {
  if (!ISO_TIME.test(time)) throw new AppError("VALIDATION_ERROR", 400, "Horário inválido.");
  const parsed = DateTime.fromISO(`${date}T${time}`, { zone: timezone });
  if (!parsed.isValid || parsed.toFormat("yyyy-LL-dd HH:mm") !== `${date} ${time}`) {
    throw new AppError("VALIDATION_ERROR", 400, "Data ou horário inválido.");
  }
  return parsed.toUTC().toJSDate();
}

export function dateRange(from: string, to: string, timezone: string, maxDays = 60): DateTime[] {
  const start = parseBusinessDate(from, timezone);
  const end = parseBusinessDate(to, timezone);
  const days = Math.floor(end.diff(start, "days").days);
  if (days < 0 || days > maxDays) {
    throw new AppError("VALIDATION_ERROR", 400, `O intervalo deve ter no máximo ${maxDays} dias.`);
  }
  return Array.from({ length: days + 1 }, (_, index) => start.plus({ days: index }));
}

export function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
