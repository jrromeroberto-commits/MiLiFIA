const LIMA_TIME_ZONE = "America/Lima";

export function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: LIMA_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: LIMA_TIME_ZONE,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatCalendarDate(date: Date) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function greetingFor(date: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: LIMA_TIME_ZONE,
      hour: "2-digit",
      hour12: false,
    }).format(date),
  );

  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}
