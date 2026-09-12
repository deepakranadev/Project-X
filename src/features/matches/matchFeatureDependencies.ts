import type { GuestTeamRepository } from "@/features/teams/teamRepository";

import type { MatchLifecycleRepository } from "./matchLifecycleRepository";
import type { MatchRepository } from "./matchRepository";
import type { MatchResultRepository } from "./matchResultRepository";
import type { MatchWriteCoordinatorRegistry } from "./matchWriteCoordinator";

export interface MatchFeatureDependencies {
  readonly lifecycle: MatchLifecycleRepository;
  readonly matches: MatchRepository;
  readonly results: MatchResultRepository;
  readonly teams: Pick<GuestTeamRepository, "listTeamsByTournament">;
  readonly writeCoordinators: MatchWriteCoordinatorRegistry;
}
