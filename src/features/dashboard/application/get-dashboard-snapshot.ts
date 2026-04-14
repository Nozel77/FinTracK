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
  const from = request.from ?? toISODate(startOfMonth(now()));
  const to = request.to ?? toISODate(endOfMonth(now()));

  assertISODate(from, "from");
  assertISODate(to, "to");

  if (new Date(from).getTime() > new Date(to).getTime()) {
    throw new Error("Invalid date range: `from` must be before or equal to `to`.");
  }

  return { from, to };
}

function assertISODate(value: string, fieldName: "from" | "to"): void {
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!isoDatePattern.test(value)) {
    throw new Error(`Invalid \`${fieldName}\` date format. Expected YYYY-MM-DD.`);
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid \`${fieldName}\` date value.`);
  }
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
