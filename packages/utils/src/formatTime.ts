/** Instant / wall-clock helpers on the Temporal API (no date-fns). */

export type DateInput = Date | string;

export type CalendarDateLabels = {
  today?: string;
  yesterday?: string;
};

const DEFAULT_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
} as const satisfies Required<CalendarDateLabels>;

const toInstant = (value: DateInput): Temporal.Instant | null => {
  try {
    if (value instanceof Date) {
      const ms = value.getTime();
      if (Number.isNaN(ms)) return null;
      return Temporal.Instant.fromEpochMilliseconds(ms);
    }
    if (typeof value !== "string" || value.length === 0) return null;
    return Temporal.Instant.from(value);
  } catch {
    return null;
  }
};

/** Local zoned wall time for `value`, or `null` when unparseable. */
export const toZonedDateTime = (
  value: DateInput | null | undefined,
  timeZone = Temporal.Now.timeZoneId(),
): Temporal.ZonedDateTime | null => {
  if (value == null) return null;
  const instant = toInstant(value);
  if (!instant) return null;
  return instant.toZonedDateTimeISO(timeZone);
};

/** ISO-8601 UTC for `<time dateTime>`. */
export const toDateTimeAttr = (value: DateInput | null | undefined): string | undefined => {
  const instant = value == null ? null : toInstant(value);
  return instant?.toString();
};

/**
 * Clock time in the local zone.
 * @param h24 - `true` → 24h (`HH:mm`); `false` → 12h with am/pm
 */
export const formatTime = (
  value: DateInput | null | undefined,
  h24 = true,
  locale?: string,
): string | undefined => {
  const zdt = toZonedDateTime(value);
  if (!zdt) return;
  return zdt.toLocaleString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !h24,
  });
};

/**
 * Calendar label: today / yesterday / weekday (≤7d) / month+weekday / full date.
 * Pass `labels` when i18n lands; defaults are English.
 */
export const formatCalendarDate = (
  value: DateInput | null | undefined,
  options?: {
    locale?: string;
    labels?: CalendarDateLabels;
    timeZone?: string;
  },
): string | undefined => {
  const timeZone = options?.timeZone ?? Temporal.Now.timeZoneId();
  const zdt = toZonedDateTime(value, timeZone);
  if (!zdt) return;

  const labels = { ...DEFAULT_LABELS, ...options?.labels };
  const locale = options?.locale;
  const day = zdt.toPlainDate();
  const today = Temporal.Now.plainDateISO(timeZone);

  if (day.equals(today)) return labels.today;
  if (day.equals(today.subtract({ days: 1 }))) return labels.yesterday;

  if (Temporal.PlainDate.compare(day, today.subtract({ days: 7 })) >= 0) {
    return zdt.toLocaleString(locale, { weekday: "long" });
  }

  if (day.year === today.year) {
    return zdt.toLocaleString(locale, {
      day: "2-digit",
      month: "long",
      weekday: "long",
    });
  }

  return zdt.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "short",
  });
};

/** Chat list row: clock if today, otherwise {@link formatCalendarDate}. */
export const formatChatListDate = (
  value: DateInput | null | undefined,
  options?: {
    h24?: boolean;
    locale?: string;
    labels?: CalendarDateLabels;
    timeZone?: string;
  },
): string | undefined => {
  const timeZone = options?.timeZone ?? Temporal.Now.timeZoneId();
  const zdt = toZonedDateTime(value, timeZone);
  if (!zdt) return;

  const today = Temporal.Now.plainDateISO(timeZone);
  if (zdt.toPlainDate().equals(today)) {
    return formatTime(value, options?.h24 ?? true, options?.locale);
  }
  return formatCalendarDate(value, options);
};
