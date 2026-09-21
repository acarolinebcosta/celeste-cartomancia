import type { Reading } from "@/types/domain";

export function createMockAvailableDates(count = 12, from = new Date()) {
  const dates: Date[] = [];
  const cursor = new Date(from);
  cursor.setHours(12, 0, 0, 0);

  while (dates.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 1) dates.push(new Date(cursor));
  }

  return dates;
}

export function createMockAvailableSlots(reading: Reading) {
  if (reading.fulfillmentType === "async") return [];
  return reading.durationMinutes === 60
    ? ["09:00", "11:00", "14:00", "16:00"]
    : ["09:30", "11:00", "14:30", "16:00", "18:00"];
}
