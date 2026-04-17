import {
  type DashboardRepository,
  type DashboardSnapshot,
  type DateRange,
} from "../domain/dashboard";

export interface GetDashboardSnapshotRequest {
  readonly from?: string;
  readonly to?: string;
}

export interface GetDashboardSnapshot {
  execute(request?: GetDashboardSnapshotRequest): Promise<DashboardSnapshot>;
}

type Clock = () => Date;

const MAX_RANGE_MONTHS = 3;
const JAKARTA_TIMEZONE = "Asia/Jakarta";

const JAKARTA_DATE_PARTS_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: JAKARTA_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const JAKARTA_WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: JAKARTA_TIMEZONE,
  weekday: "short",
});

export class GetDashboardSnapshotUseCase implements GetDashboardSnapshot {
  constructor(
    private readonly repository: DashboardRepository,
    private readonly now: Clock = () => new Date(),
  ) {}

  async execute(
    request: GetDashboardSnapshotRequest = {},
  ): Promise<DashboardSnapshot> {
    const range = resolveDateRange(request, this.now);
    return this.repository.getSnapshot(range);
  }
}

function resolveDateRange(
  request: GetDashboardSnapshotRequest,
  now: Clock,
): DateRange {
  const currentDate = now();
  const startOfCurrentWeek = getStartOfWeekJakartaISO(currentDate);
  const endOfCurrentWeek = addIsoDateDays(startOfCurrentWeek, 6);

  const from = request.from ?? startOfCurrentWeek;
  const to = request.to ?? endOfCurrentWeek;

  assertISODate(from, "from");
  assertISODate(to, "to");

  const fromDate = parseIsoDateAsUtc(from);
  const toDate = parseIsoDateAsUtc(to);

  if (fromDate.getTime() > toDate.getTime()) {
    throw new Error(
      "Invalid date range: `from` must be before or equal to `to`.",
    );
  }

  const maxToDate = addMonths(fromDate, MAX_RANGE_MONTHS);
  if (toDate.getTime() > maxToDate.getTime()) {
    throw new Error("Invalid date range: maximum window is 3 months.");
  }

  return { from, to };
}

function assertISODate(value: string, fieldName: "from" | "to"): void {
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!isoDatePattern.test(value)) {
    throw new Error(
      `Invalid \`${fieldName}\` date format. Expected YYYY-MM-DD.`,
    );
  }

  const timestamp = parseIsoDateAsUtc(value).getTime();
  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid \`${fieldName}\` date value.`);
  }
}

function addMonths(date: Date, months: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + months,
      date.getUTCDate(),
    ),
  );
}

function getStartOfWeekJakartaISO(date: Date): string {
  const weekday = getJakartaWeekday(date); // 0 (Sun) .. 6 (Sat)
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const jakartaToday = toJakartaISODate(date);

  return addIsoDateDays(jakartaToday, mondayOffset);
}

function getJakartaWeekday(date: Date): number {
  const weekday = JAKARTA_WEEKDAY_FORMATTER.format(date);

  if (weekday === "Sun") return 0;
  if (weekday === "Mon") return 1;
  if (weekday === "Tue") return 2;
  if (weekday === "Wed") return 3;
  if (weekday === "Thu") return 4;
  if (weekday === "Fri") return 5;
  if (weekday === "Sat") return 6;

  throw new Error(`Unable to resolve Jakarta weekday from value "${weekday}".`);
}

function toJakartaISODate(date: Date): string {
  const parts = JAKARTA_DATE_PARTS_FORMATTER.formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to format date in Asia/Jakarta timezone.");
  }

  return `${year}-${month}-${day}`;
}

function addIsoDateDays(isoDate: string, days: number): string {
  const base = parseIsoDateAsUtc(isoDate);
  base.setUTCDate(base.getUTCDate() + days);
  return toUtcISODate(base);
}

function parseIsoDateAsUtc(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function toUtcISODate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
