export const INDONESIA_TIME_ZONE = "Asia/Jakarta";
const JAKARTA_OFFSET = "+07:00";
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
const formatterCache = new Map<string, Intl.DateTimeFormat>();
const jakartaDatePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: INDONESIA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function normalizeDateOnlyString(value: string) {
  const trimmed = value.trim();
  const matched = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);

  if (!matched) {
    throw new Error(`Invalid date string: ${value}`);
  }

  return matched[1];
}

function getDateParts(value: string) {
  const [year, month, day] = normalizeDateOnlyString(value)
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid date string: ${value}`);
  }

  return { year, month, day };
}

function getFormatter(
  locale: string,
  options: Intl.DateTimeFormatOptions,
) {
  const normalizedOptions = {
    ...options,
    timeZone: INDONESIA_TIME_ZONE,
  };
  const cacheKey = `${locale}:${Object.entries(normalizedOptions)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${String(value)}`)
    .join("|")}`;
  const cachedFormatter = formatterCache.get(cacheKey);

  if (cachedFormatter) {
    return cachedFormatter;
  }

  const formatter = new Intl.DateTimeFormat(locale, normalizedOptions);
  formatterCache.set(cacheKey, formatter);
  return formatter;
}

function getFormatterParts(date: Date) {
  const parts = jakartaDatePartsFormatter.formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to extract Jakarta date parts");
  }

  return { year, month, day };
}

export function parseDateOnlyToLocalDate(value: string) {
  const { year, month, day } = getDateParts(value);

  // Use noon to avoid timezone boundary issues in local browser calendars.
  return new Date(year, month - 1, day, 12);
}

export function parseDateOnlyToJakartaDate(
  value: string,
  time = "00:00:00",
) {
  return new Date(`${value}T${time}${JAKARTA_OFFSET}`);
}

export function formatDateInJakarta(
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
  locale = "id-ID",
) {
  let date: Date;

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      date = parseDateOnlyToJakartaDate(value);
    } else {
      date = new Date(value);

      if (!isValidDate(date)) {
        date = parseDateOnlyToJakartaDate(normalizeDateOnlyString(value));
      }
    }
  } else {
    date = value;
  }

  if (!isValidDate(date)) {
    throw new Error("Invalid time value");
  }

  return getFormatter(locale, options).format(date);
}

export function getJakartaTodayDateString(now = new Date()) {
  const { year, month, day } = getFormatterParts(now);
  return `${year}-${month}-${day}`;
}

export function getDaysUntilDate(value: string, now = new Date()) {
  const today = getJakartaTodayDateString(now);
  const targetDate = parseDateOnlyToJakartaDate(normalizeDateOnlyString(value));
  const todayDate = parseDateOnlyToJakartaDate(today);

  return Math.round(
    (targetDate.getTime() - todayDate.getTime()) / MILLISECONDS_PER_DAY,
  );
}

export function toDateInputValue(value: string | null | undefined) {
  return value ? normalizeDateOnlyString(value) : "";
}
