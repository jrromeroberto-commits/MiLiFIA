export const LIFEOS_TIME_ZONE = "America/Lima";

export function localDateKey(
  date: Date,
  timeZone: string = LIFEOS_TIME_ZONE,
) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function offsetDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function calendarDateUtc(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export function weekRange(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;

  return {
    start: offsetDateKey(dateKey, -daysSinceMonday),
    end: offsetDateKey(dateKey, 6 - daysSinceMonday),
  };
}

export function monthRange(dateKey: string) {
  const [year, month] = dateKey.split("-").map(Number);
  const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return {
    start: `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-01`,
    end,
  };
}

function timeZoneOffsetMinutes(date: Date, timeZone: string) {
  const zoneName = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  if (!zoneName || zoneName === "GMT") return 0;
  const match = zoneName.match(/^GMT([+-])(\d{2}):?(\d{2})$/);
  if (!match) throw new Error(`No se pudo calcular el offset de ${timeZone}.`);

  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === "+" ? minutes : -minutes;
}

export function localDateStartUtc(
  dateKey: string,
  timeZone: string = LIFEOS_TIME_ZONE,
) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcMidnight = Date.UTC(year, month - 1, day);
  const offset = timeZoneOffsetMinutes(new Date(utcMidnight), timeZone);
  return new Date(utcMidnight - offset * 60_000);
}

export function localDateRangeUtc(
  startDateKey: string,
  endDateKey: string,
  timeZone: string = LIFEOS_TIME_ZONE,
) {
  return {
    start: localDateStartUtc(startDateKey, timeZone),
    endExclusive: localDateStartUtc(offsetDateKey(endDateKey, 1), timeZone),
  };
}
