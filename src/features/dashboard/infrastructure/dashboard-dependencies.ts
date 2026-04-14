import type { DashboardRepository } from "../domain/dashboard";
import type {
  GetDashboardSnapshot,
  GetDashboardSnapshotRequest,
} from "../application/get-dashboard-snapshot";
import { GetDashboardSnapshotUseCase } from "../application/get-dashboard-snapshot";
import {
  toDashboardViewModel,
  type DashboardViewModel,
} from "../presentation/view-models/dashboard-view-model";
import {
  staticDashboardRepository,
  StaticDashboardRepository,
} from "./static-dashboard-repository";
import { createSupabaseDashboardRepository } from "./supabase/supabase-dashboard-repository";
import { hasSupabasePublicEnv } from "@/src/shared/supabase/env";

type Clock = () => Date;

export type RepositorySource = "supabase" | "static";

export type DashboardDependencies = {
  readonly repository: DashboardRepository;
  readonly repositorySource: RepositorySource;
  readonly getDashboardSnapshot: GetDashboardSnapshot;
  readonly loadDashboardViewModel: (
    request?: GetDashboardSnapshotRequest,
  ) => Promise<DashboardViewModel>;
};

export type CreateDashboardDependenciesOptions = {
  readonly repository?: DashboardRepository;
  readonly now?: Clock;
  readonly preferSupabase?: boolean;
  readonly supabaseUserId?: string;
};

export function createDashboardDependencies(
  options: CreateDashboardDependenciesOptions = {},
): DashboardDependencies {
  const resolved = resolveRepository(options);

  const getDashboardSnapshot = new GetDashboardSnapshotUseCase(
    resolved.repository,
    options.now,
  );

  async function loadDashboardViewModel(
    request?: GetDashboardSnapshotRequest,
  ): Promise<DashboardViewModel> {
    const snapshot = await getDashboardSnapshot.execute(request);
    return toDashboardViewModel(snapshot);
  }

  return {
    repository: resolved.repository,
    repositorySource: resolved.source,
    getDashboardSnapshot,
    loadDashboardViewModel,
  };
}

function resolveRepository(options: CreateDashboardDependenciesOptions): {
  repository: DashboardRepository;
  source: RepositorySource;
} {
  if (options.repository) {
    return { repository: options.repository, source: "static" };
  }

  const preferSupabase = options.preferSupabase ?? true;

  if (preferSupabase && hasSupabasePublicEnv()) {
    try {
      return {
        repository: createSupabaseDashboardRepository({
          userId: options.supabaseUserId,
        }),
        source: "supabase",
      };
    } catch {
      return {
        repository: getStaticRepository(),
        source: "static",
      };
    }
  }

  return {
    repository: getStaticRepository(),
    source: "static",
  };
}

function getStaticRepository(): DashboardRepository {
  return staticDashboardRepository ?? new StaticDashboardRepository();
}
