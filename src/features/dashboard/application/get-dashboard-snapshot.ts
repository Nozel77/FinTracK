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
  const today = toISODate(now());
  const from = request.from ?? today;
  const to = request.to ?? today;

  assertISODate(from, "from");
  assertISODate(to, "to");

  const fromDate = new Date(from);
  const toDate = new Date(to);

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

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid \`${fieldName}\` date value.`);
  }
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
